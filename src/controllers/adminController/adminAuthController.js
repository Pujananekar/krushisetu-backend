import bcrypt from "bcrypt";
import crypto from "crypto";

import pool from "../../config/db.js";
import transporter from "../../config/mail.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

/*
|--------------------------------------------------------------------------
| ADMIN LOGIN
|--------------------------------------------------------------------------
*/

export const login = wrapAsync(async (req, res) => {
    const { username, password } = req.body;

    /*
     * Validate required fields.
     */
    if (
        !username ||
        typeof username !== "string" ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required.",
        });
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required.",
        });
    }

    /*
     * Find admin by username.
     */
    const [result] = await pool.query(
        `
        SELECT
            id,
            name,
            username,
            email,
            password_hash,
            role,
            is_active,
            failed_login_attempts,
            locked_until
        FROM admin_users
        WHERE username = ?
        LIMIT 1
        `,
        [normalizedUsername]
    );

    /*
     * Do not reveal whether the username exists.
     */
    if (result.length === 0) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials.",
        });
    }

    const admin = result[0];

    /*
     * Check whether the account is active.
     */
    if (!admin.is_active) {
        return res.status(403).json({
            success: false,
            message: "Your account is inactive.",
        });
    }

    /*
     * Check whether the account is temporarily locked.
     */
    if (
        admin.locked_until &&
        new Date(admin.locked_until) > new Date()
    ) {
        return res.status(423).json({
            success: false,
            message:
                "Your account is temporarily locked. Please try again later.",
        });
    }

    /*
     * Compare entered password with bcrypt hash.
     */
    const passwordMatch = await bcrypt.compare(
        password,
        admin.password_hash
    );

    if (!passwordMatch) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials.",
        });
    }

    /*
     * Successful login.
     *
     * Reset failed login information.
     */
    await pool.query(
        `
        UPDATE admin_users
        SET
            last_login_at = NOW(),
            failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = ?
        `,
        [admin.id]
    );

    /*
     * Create server-side session.
     *
     * Only the required admin information is stored
     * in the session.
     */
    req.session.admin = {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
    };

    /*
     * Explicitly save the session before responding.
     */
    await new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });

    /*
     * Return successful login response.
     */
    return res.status(200).json({
        success: true,
        message: "Login successful.",
        admin: {
            id: admin.id,
            name: admin.name,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        },
    });
});


/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

export const forgotPassword = wrapAsync(async (req, res) => {
    const { email } = req.body;

    /*
     * Always return the same response.
     *
     * This prevents revealing whether an admin
     * account exists for a particular email.
     */
    const genericResponse = {
        success: true,
        message:
            "If an account exists with this email, a password reset link has been sent.",
    };

    /*
     * Validate email input.
     */
    if (!email || typeof email !== "string") {
        return res.status(200).json(genericResponse);
    }

    const normalizedEmail = email.trim().toLowerCase();

    /*
     * Basic email validation.
     */
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
        return res.status(200).json(genericResponse);
    }

    /*
     * Find active admin account by email.
     *
     * Email is used only for password recovery,
     * not for normal login.
     */
    const [admins] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            is_active
        FROM admin_users
        WHERE email = ?
        LIMIT 1
        `,
        [normalizedEmail]
    );

    if (
        admins.length === 0 ||
        !admins[0].is_active
    ) {
        return res.status(200).json(genericResponse);
    }

    const admin = admins[0];

    /*
     * Invalidate any previous unused reset tokens
     * for this admin.
     */
    await pool.query(
        `
        UPDATE admin_password_reset_tokens
        SET used_at = NOW()
        WHERE admin_id = ?
          AND used_at IS NULL
        `,
        [admin.id]
    );

    /*
     * Generate a cryptographically secure random token.
     *
     * The raw token is sent only through the email.
     * It is NEVER stored in the database.
     */
    const resetToken = crypto
        .randomBytes(32)
        .toString("hex");

    /*
     * Store only SHA-256 hash of the token.
     */
    const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    /*
     * Token expires after 15 minutes.
     */
    await pool.query(
        `
        INSERT INTO admin_password_reset_tokens
        (
            admin_id,
            token_hash,
            expires_at
        )
        VALUES
        (
            ?,
            ?,
            DATE_ADD(NOW(), INTERVAL 15 MINUTE)
        )
        `,
        [
            admin.id,
            tokenHash,
        ]
    );

    /*
     * Password reset URL.
     *
     * FRONTEND_URL should contain the frontend
     * origin/base path, for example:
     *
     * http://localhost:5173/krushisetu
     */
    const frontendUrl =
        `${process.env.FRONTEND_URL}` ||
        "http://localhost:5173/krushisetu";

    const resetUrl =
        `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    /*
     * Send password reset email using the
     * existing Nodemailer transporter.
     */
    try {
        await transporter.sendMail({
            from:
                process.env.MAIL_FROM ||
                process.env.MAIL_USER,

            to: admin.email,

            subject:
                "Krushisetu Admin Password Reset",

            text: `
You requested to reset your Krushisetu admin password.

Use the following link to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.
            `,

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #1f2937;
                        max-width: 600px;
                        margin: 0 auto;
                    "
                >

                    <div
                        style="
                            background: #15803d;
                            padding: 20px;
                            border-radius: 12px 12px 0 0;
                            text-align: center;
                        "
                    >
                        <h2
                            style="
                                color: #ffffff;
                                margin: 0;
                            "
                        >
                            Krushisetu Admin
                        </h2>
                    </div>

                    <div
                        style="
                            padding: 30px;
                            border: 1px solid #e5e7eb;
                            border-top: none;
                            border-radius: 0 0 12px 12px;
                        "
                    >

                        <h3>
                            Password Reset Request
                        </h3>

                        <p>
                            Hello ${admin.name || "Admin"},
                        </p>

                        <p>
                            We received a request to reset
                            your Krushisetu admin account password.
                        </p>

                        <p>
                            Click the button below to create
                            a new password:
                        </p>

                        <p style="margin: 25px 0;">
                            <a
                                href="${resetUrl}"
                                style="
                                    display: inline-block;
                                    padding: 12px 22px;
                                    background: #15803d;
                                    color: #ffffff;
                                    text-decoration: none;
                                    border-radius: 8px;
                                    font-weight: 600;
                                "
                            >
                                Reset Password
                            </a>
                        </p>

                        <p>
                            This password reset link will expire
                            in <strong>15 minutes</strong>.
                        </p>

                        <p>
                            If you did not request a password
                            reset, you can safely ignore this email.
                        </p>

                        <hr
                            style="
                                border: none;
                                border-top: 1px solid #e5e7eb;
                                margin: 25px 0;
                            "
                        />

                        <p
                            style="
                                font-size: 12px;
                                color: #6b7280;
                            "
                        >
                            This is an automated email.
                            Please do not reply to this message.
                        </p>

                    </div>

                </div>
            `,
        });
    } catch (error) {
        /*
         * If email sending fails, remove the token
         * that was just created.
         */
        await pool.query(
            `
            DELETE FROM admin_password_reset_tokens
            WHERE token_hash = ?
            `,
            [tokenHash]
        );

        console.error(
            "Password reset email error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send password reset email. Please try again later.",
        });
    }

    return res.status(200).json(genericResponse);
});


/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

export const resetPassword = wrapAsync(async (req, res) => {
    const {
        token,
        password,
        confirmPassword,
    } = req.body;

    /*
     * Required fields.
     */
    if (
        !token ||
        !password ||
        !confirmPassword
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Token, password and confirm password are required.",
        });
    }

    /*
     * Check password confirmation.
     */
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message:
                "Passwords do not match.",
        });
    }

    /*
     * Minimum password length.
     */
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message:
                "Password must be at least 8 characters long.",
        });
    }

    /*
     * Hash the token received from the frontend.
     *
     * The database contains only this hash.
     */
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    /*
     * Find valid reset token.
     */
    const [tokens] = await pool.query(
        `
        SELECT
            id,
            admin_id,
            expires_at,
            used_at
        FROM admin_password_reset_tokens
        WHERE token_hash = ?
        LIMIT 1
        `,
        [tokenHash]
    );

    if (tokens.length === 0) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid or expired password reset link.",
        });
    }

    const resetToken = tokens[0];

    /*
     * Token can only be used once.
     */
    if (resetToken.used_at) {
        return res.status(400).json({
            success: false,
            message:
                "This password reset link has already been used.",
        });
    }

    /*
     * Check token expiration.
     */
    if (
        new Date(resetToken.expires_at) <=
        new Date()
    ) {
        return res.status(400).json({
            success: false,
            message:
                "This password reset link has expired.",
        });
    }

    /*
     * Get admin account.
     */
    const [admins] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            role,
            is_active
        FROM admin_users
        WHERE id = ?
        LIMIT 1
        `,
        [resetToken.admin_id]
    );

    if (admins.length === 0) {
        return res.status(400).json({
            success: false,
            message:
                "Admin account could not be found.",
        });
    }

    const admin = admins[0];

    /*
     * Inactive admin accounts cannot reset passwords.
     */
    if (!admin.is_active) {
        return res.status(403).json({
            success: false,
            message:
                "This admin account is inactive.",
        });
    }

    /*
     * Hash new password.
     */
    const passwordHash =
        await bcrypt.hash(password, 12);

    /*
     * Use a transaction so password update
     * and token invalidation happen together.
     */
    const connection =
        await pool.getConnection();

    try {
        await connection.beginTransaction();

        /*
         * Update password.
         */
        await connection.query(
            `
            UPDATE admin_users
            SET
                password_hash = ?,
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = ?
            `,
            [
                passwordHash,
                admin.id,
            ]
        );

        /*
         * Mark the current reset token as used.
         */
        await connection.query(
            `
            UPDATE admin_password_reset_tokens
            SET used_at = NOW()
            WHERE id = ?
            `,
            [resetToken.id]
        );

        /*
         * Invalidate all other unused reset tokens
         * belonging to the same admin.
         */
        await connection.query(
            `
            UPDATE admin_password_reset_tokens
            SET used_at = NOW()
            WHERE admin_id = ?
              AND used_at IS NULL
            `,
            [admin.id]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();

        throw error;
    } finally {
        connection.release();
    }

    return res.status(200).json({
        success: true,
        message:
            "Password reset successfully. You can now log in with your new password.",
    });
});
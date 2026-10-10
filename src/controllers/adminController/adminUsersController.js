
import bcrypt from "bcrypt";
import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

const ALLOWED_ROLES = [
    "SUPER_ADMIN",
    "CONTENT_ADMIN",
    "SCHEME_MANAGER",
    "TRAINING_MANAGER",
    "PROGRAM_MANAGER",
    "CRM_SUPPORT",
    "MEDIA_MANAGER",
    "REPORT_VIEWER",
];

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,100}$/;

const getBooleanValue = (value, defaultValue = false) => {
    if (value === undefined || value === null) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return value === true || value === "true" || value === 1 || value === "1";
};

const validateUsername = (username) => {
    const cleanUsername = String(username ?? "").trim();

    if (!cleanUsername) {
        return "Username is required.";
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
        return "Username must be 3–100 characters and contain only letters, numbers, dots, underscores or hyphens.";
    }

    return null;
};

const isDuplicateEntryError = (error) => error?.code === "ER_DUP_ENTRY";

// GET ALL ADMIN USERS
export const getAdminUsers = wrapAsync(async (req, res) => {
    const [admins] = await pool.query(`
        SELECT
            id,
            name,
            username,
            email,
            role,
            is_active,
            two_factor_enabled,
            last_login_at,
            failed_login_attempts,
            locked_until,
            created_at,
            updated_at
        FROM admin_users
        ORDER BY created_at DESC
    `);

    return res.status(200).json({
        success: true,
        data: admins,
    });
});

// GET ADMIN USER BY ID
export const getAdminUserById = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [admins] = await pool.query(
        `
            SELECT
                id,
                name,
                username,
                email,
                role,
                is_active,
                two_factor_enabled,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            FROM admin_users
            WHERE id = ?
        `,
        [id]
    );

    if (admins.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Admin user not found.",
        });
    }

    return res.status(200).json({
        success: true,
        data: admins[0],
    });
});

// CREATE ADMIN USER
export const createAdminUser = wrapAsync(async (req, res) => {
    const {
        name,
        username,
        email,
        password,
        role,
        is_active,
        two_factor_enabled,
    } = req.body;

    if (
        name === undefined ||
        username === undefined ||
        email === undefined ||
        password === undefined ||
        !role
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, username, email, password and role are required.",
        });
    }

    const cleanName = String(name).trim();
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanName) {
        return res.status(400).json({
            success: false,
            message: "Name cannot be empty.",
        });
    }

    const usernameError = validateUsername(cleanUsername);

    if (usernameError) {
        return res.status(400).json({
            success: false,
            message: usernameError,
        });
    }

    if (!cleanEmail) {
        return res.status(400).json({
            success: false,
            message: "Email cannot be empty.",
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address.",
        });
    }

    if (String(password).length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long.",
        });
    }

    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid admin role.",
        });
    }

    const [existingUsername] = await pool.query(
        "SELECT id FROM admin_users WHERE username = ? LIMIT 1",
        [cleanUsername]
    );

    if (existingUsername.length > 0) {
        return res.status(409).json({
            success: false,
            message: "An admin user with this username already exists.",
        });
    }

    const [existingEmail] = await pool.query(
        "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
        [cleanEmail]
    );

    if (existingEmail.length > 0) {
        return res.status(409).json({
            success: false,
            message: "An admin user with this email already exists.",
        });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const active = getBooleanValue(is_active, true);
    const twoFactorEnabled = getBooleanValue(
        two_factor_enabled,
        false
    );

    let result;

    try {
        const [insertResult] = await pool.query(
            `
                INSERT INTO admin_users (
                    name,
                    username,
                    email,
                    password_hash,
                    role,
                    is_active,
                    two_factor_enabled
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                cleanName,
                cleanUsername,
                cleanEmail,
                passwordHash,
                role,
                active ? 1 : 0,
                twoFactorEnabled ? 1 : 0,
            ]
        );

        result = insertResult;
    } catch (error) {
        if (isDuplicateEntryError(error)) {
            return res.status(409).json({
                success: false,
                message: "An admin user with this username or email already exists.",
            });
        }

        throw error;
    }

    const [createdAdmins] = await pool.query(
        `
            SELECT
                id,
                name,
                username,
                email,
                role,
                is_active,
                two_factor_enabled,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            FROM admin_users
            WHERE id = ?
        `,
        [result.insertId]
    );

    return res.status(201).json({
        success: true,
        message: "Admin user created successfully.",
        data: createdAdmins[0],
    });
});

// UPDATE ADMIN USER
export const updateAdminUser = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const {
        name,
        username,
        email,
        password,
        role,
        is_active,
        two_factor_enabled,
    } = req.body;

    const [existingAdmins] = await pool.query(
        "SELECT id FROM admin_users WHERE id = ?",
        [id]
    );

    if (existingAdmins.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Admin user not found.",
        });
    }

    const fields = [];
    const values = [];

    // Update name
    if (name !== undefined) {
        const cleanName = String(name).trim();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty.",
            });
        }

        fields.push("name = ?");
        values.push(cleanName);
    }

    // Update username
    if (username !== undefined) {
        const cleanUsername = String(username).trim();
        const usernameError = validateUsername(cleanUsername);

        if (usernameError) {
            return res.status(400).json({
                success: false,
                message: usernameError,
            });
        }

        const [usernameUsers] = await pool.query(
            `
                SELECT id
                FROM admin_users
                WHERE username = ? AND id != ?
                LIMIT 1
            `,
            [cleanUsername, id]
        );

        if (usernameUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another admin user already uses this username.",
            });
        }

        fields.push("username = ?");
        values.push(cleanUsername);
    }

    // Update email
    if (email !== undefined) {
        const cleanEmail = String(email).trim().toLowerCase();

        if (!cleanEmail) {
            return res.status(400).json({
                success: false,
                message: "Email cannot be empty.",
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address.",
            });
        }

        const [emailUsers] = await pool.query(
            `
                SELECT id
                FROM admin_users
                WHERE email = ? AND id != ?
                LIMIT 1
            `,
            [cleanEmail, id]
        );

        if (emailUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another admin user already uses this email.",
            });
        }

        fields.push("email = ?");
        values.push(cleanEmail);
    }

    // Update role
    if (role !== undefined) {
        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin role.",
            });
        }

        fields.push("role = ?");
        values.push(role);
    }

    // Update account status
    if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(getBooleanValue(is_active) ? 1 : 0);
    }

    // Update two-factor authentication setting
    if (two_factor_enabled !== undefined) {
        fields.push("two_factor_enabled = ?");
        values.push(
            getBooleanValue(two_factor_enabled) ? 1 : 0
        );
    }

    // Update password only when a new password is provided
    if (password !== undefined && password !== "") {
        const cleanPassword = String(password);

        if (cleanPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        const passwordHash = await bcrypt.hash(cleanPassword, 12);

        fields.push("password_hash = ?");
        values.push(passwordHash);
    }

    if (fields.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No changes were provided.",
        });
    }

    values.push(id);

    try {
        await pool.query(
            `
                UPDATE admin_users
                SET ${fields.join(", ")}
                WHERE id = ?
            `,
            values
        );
    } catch (error) {
        if (isDuplicateEntryError(error)) {
            return res.status(409).json({
                success: false,
                message: "An admin user with this username or email already exists.",
            });
        }

        throw error;
    }

    const [updatedAdmins] = await pool.query(
        `
            SELECT
                id,
                name,
                username,
                email,
                role,
                is_active,
                two_factor_enabled,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            FROM admin_users
            WHERE id = ?
        `,
        [id]
    );

    return res.status(200).json({
        success: true,
        message: "Admin user updated successfully.",
        data: updatedAdmins[0],
    });
});

// TOGGLE ADMIN USER STATUS
export const toggleAdminUserStatus = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [admins] = await pool.query(
        "SELECT id, is_active FROM admin_users WHERE id = ?",
        [id]
    );

    if (admins.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Admin user not found.",
        });
    }

    const newStatus = Number(admins[0].is_active) === 1 ? 0 : 1;

    await pool.query(
        "UPDATE admin_users SET is_active = ? WHERE id = ?",
        [newStatus, id]
    );

    return res.status(200).json({
        success: true,
        message: newStatus
            ? "Admin user activated successfully."
            : "Admin user deactivated successfully.",
        data: {
            id: Number(id),
            is_active: newStatus,
        },
    });
});

// DELETE ADMIN USER
export const deleteAdminUser = wrapAsync(async (req, res) => {
    const { id } = req.params;

    // Prevent an admin from deleting their own account.
    if (Number(id) === Number(req.session?.admin?.id)) {
        return res.status(403).json({
            success: false,
            message: "You cannot remove your own admin account.",
        });
    }

    const [admins] = await pool.query(
        `
            SELECT
                id,
                role,
                is_active
            FROM admin_users
            WHERE id = ?
        `,
        [id]
    );

    if (admins.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Admin user not found.",
        });
    }

    const admin = admins[0];

    // Prevent deleting the last active Super Admin.
    if (
        admin.role === "SUPER_ADMIN" &&
        Number(admin.is_active) === 1
    ) {
        const [superAdmins] = await pool.query(
            `
                SELECT COUNT(*) AS total
                FROM admin_users
                WHERE role = 'SUPER_ADMIN'
                  AND is_active = 1
            `
        );

        if (Number(superAdmins[0].total) <= 1) {
            return res.status(403).json({
                success: false,
                message: "The last active Super Admin cannot be removed.",
            });
        }
    }

    await pool.query(
        "DELETE FROM admin_users WHERE id = ?",
        [id]
    );

    return res.status(200).json({
        success: true,
        message: "Admin user deleted successfully.",
    });
});

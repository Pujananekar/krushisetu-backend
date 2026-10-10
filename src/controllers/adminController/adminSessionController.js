import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

export const getCurrentAdmin = wrapAsync(async (req, res) => {
    if (!req.session?.admin?.id) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated.",
        });
    }

    const adminId = req.session.admin.id;

    const [admins] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            role,
            is_active,
            two_factor_enabled,
            last_login_at,
            created_at,
            updated_at
        FROM admin_users
        WHERE id = ?
        LIMIT 1
        `,
        [adminId]
    );

    if (admins.length === 0) {
        await destroySession(req);

        return res.status(401).json({
            success: false,
            message: "Admin account not found.",
        });
    }

    const admin = admins[0];

    if (!admin.is_active) {
        await destroySession(req);

        return res.status(403).json({
            success: false,
            message: "Admin account is inactive.",
        });
    }

    const [permissions] = await pool.query(
        `
        SELECT
            p.id,
            p.name,
            p.slug,
            p.module,
            p.\`action\`,
            p.description
        FROM role_permissions rp
        INNER JOIN permissions p
            ON p.id = rp.permission_id
        WHERE rp.role = ?
        ORDER BY
            p.module ASC,
            p.\`action\` ASC
        `,
        [admin.role]
    );

    return res.status(200).json({
        success: true,

        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            is_active: admin.is_active,
            two_factor_enabled: admin.two_factor_enabled,
            last_login_at: admin.last_login_at,
            created_at: admin.created_at,
            updated_at: admin.updated_at,
        },

        permissions,
    });
});


export const logoutAdmin = wrapAsync(async (req, res) => {
    if (!req.session) {
        return res.status(200).json({
            success: true,
            message: "Logged out successfully.",
        });
    }

    await destroySession(req);

    res.clearCookie(
        process.env.SESSION_NAME ||
            "krushisetu_admin_session",
        {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "lax",
        }
    );

    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
});


const destroySession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
};
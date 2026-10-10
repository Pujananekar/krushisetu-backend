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

/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/
export const getRoles = wrapAsync(async (req, res) => {
    return res.status(200).json({
        success: true,
        data: ALLOWED_ROLES,
    });
});

/*
|--------------------------------------------------------------------------
| Get All Permissions
|--------------------------------------------------------------------------
*/
export const getPermissions = wrapAsync(async (req, res) => {
    const [permissions] = await pool.query(`
        SELECT
            id,
            name,
            slug,
            module,
            action,
            description,
            created_at,
            updated_at
        FROM permissions
        ORDER BY module ASC, action ASC
    `);

    return res.status(200).json({
        success: true,
        data: permissions,
    });
});

/*
|--------------------------------------------------------------------------
| Get Permissions Assigned To A Role
|--------------------------------------------------------------------------
*/
export const getRolePermissions = wrapAsync(async (req, res) => {
    const { role } = req.params;

    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid role.",
        });
    }

    const [permissions] = await pool.query(
        `
        SELECT
            p.id,
            p.name,
            p.slug,
            p.module,
            p.action,
            p.description
        FROM role_permissions rp
        INNER JOIN permissions p
            ON p.id = rp.permission_id
        WHERE rp.role = ?
        ORDER BY p.module ASC, p.action ASC
        `,
        [role]
    );

    return res.status(200).json({
        success: true,
        data: {
            role,
            permissions,
        },
    });
});

/*
|--------------------------------------------------------------------------
| Get Role With All Permissions
|--------------------------------------------------------------------------
*/
export const getRolePermissionMatrix = wrapAsync(async (req, res) => {
    const { role } = req.params;

    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid role.",
        });
    }

    const [permissions] = await pool.query(`
        SELECT
            id,
            name,
            slug,
            module,
            action,
            description
        FROM permissions
        ORDER BY module ASC, action ASC
    `);

    const [assignedPermissions] = await pool.query(
        `
        SELECT permission_id
        FROM role_permissions
        WHERE role = ?
        `,
        [role]
    );

    const assignedIds = new Set(
        assignedPermissions.map(
            (permission) => Number(permission.permission_id)
        )
    );

    const matrix = permissions.map((permission) => ({
        ...permission,
        assigned: assignedIds.has(Number(permission.id)),
    }));

    return res.status(200).json({
        success: true,
        data: {
            role,
            permissions: matrix,
        },
    });
});

/*
|--------------------------------------------------------------------------
| Update Permissions For A Role
|--------------------------------------------------------------------------
*/
export const updateRolePermissions = wrapAsync(async (req, res) => {
    const { role } = req.params;
    const { permission_ids } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid role.",
        });
    }

    if (!Array.isArray(permission_ids)) {
        return res.status(400).json({
            success: false,
            message: "permission_ids must be an array.",
        });
    }

    const permissionIds = [
        ...new Set(
            permission_ids
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && id > 0)
        ),
    ];

    /*
    |--------------------------------------------------------------------------
    | Prevent accidental removal of SUPER_ADMIN permissions
    |--------------------------------------------------------------------------
    */

    if (role === "SUPER_ADMIN") {
        const [allPermissions] = await pool.query(`
            SELECT id
            FROM permissions
        `);

        const allPermissionIds = allPermissions.map(
            (permission) => Number(permission.id)
        );

        const missingPermissions = allPermissionIds.filter(
            (id) => !permissionIds.includes(id)
        );

        if (missingPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "SUPER_ADMIN must have all available permissions.",
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Permission IDs
    |--------------------------------------------------------------------------
    */

    if (permissionIds.length > 0) {
        const placeholders = permissionIds.map(() => "?").join(",");

        const [existingPermissions] = await pool.query(
            `
            SELECT id
            FROM permissions
            WHERE id IN (${placeholders})
            `,
            permissionIds
        );

        const existingIds = existingPermissions.map(
            (permission) => Number(permission.id)
        );

        const invalidIds = permissionIds.filter(
            (id) => !existingIds.includes(id)
        );

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "One or more permission IDs are invalid.",
                invalid_permission_ids: invalidIds,
            });
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        /*
        |--------------------------------------------------------------------------
        | Remove Existing Permissions
        |--------------------------------------------------------------------------
        */

        await connection.query(
            `
            DELETE FROM role_permissions
            WHERE role = ?
            `,
            [role]
        );

        /*
        |--------------------------------------------------------------------------
        | Add New Permissions
        |--------------------------------------------------------------------------
        */

        if (permissionIds.length > 0) {
            const values = permissionIds.map((permissionId) => [
                role,
                permissionId,
            ]);

            await connection.query(
                `
                INSERT INTO role_permissions
                    (role, permission_id)
                VALUES ?
                `,
                [values]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Role permissions updated successfully.",
            data: {
                role,
                permission_count: permissionIds.length,
                permission_ids: permissionIds,
            },
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});
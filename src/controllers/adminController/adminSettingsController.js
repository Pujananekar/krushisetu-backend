import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

export const getSettings = wrapAsync(async (req, res) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            settings,
            updated_by,
            created_at,
            updated_at
        FROM site_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    if (rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Site settings not found.",
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            id: rows[0].id,
            settings: rows[0].settings,
            updatedBy: rows[0].updated_by,
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at,
        },
    });
});

export const updateSettings = wrapAsync(async (req, res) => {
    const settings = req.body;

    if (
        !settings ||
        typeof settings !== "object" ||
        Array.isArray(settings)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid settings data.",
        });
    }

    if (!req.session?.admin?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const adminId = req.session.admin.id;

    const [existingRows] = await pool.query(
        `
        SELECT
            id
        FROM site_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    if (existingRows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Site settings not found.",
        });
    }

    await pool.query(
        `
        UPDATE site_settings
        SET
            settings = ?,
            updated_by = ?
        WHERE id = 1
        `,
        [
            JSON.stringify(settings),
            adminId,
        ]
    );

    const [updatedRows] = await pool.query(
        `
        SELECT
            id,
            settings,
            updated_by,
            created_at,
            updated_at
        FROM site_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    return res.status(200).json({
        success: true,
        message: "Settings updated successfully.",
        data: {
            id: updatedRows[0].id,
            settings: updatedRows[0].settings,
            updatedBy: updatedRows[0].updated_by,
            createdAt: updatedRows[0].created_at,
            updatedAt: updatedRows[0].updated_at,
        },
    });
});
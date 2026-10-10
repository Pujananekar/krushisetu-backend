import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

const allowedStatuses = [
    "NEW",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
];

export const getEnquiries = wrapAsync(async (req, res) => {
    const [enquiries] = await pool.query(`
        SELECT
            id,
            reference_number,
            name,
            phone,
            email,
            message,
            status,
            created_at,
            updated_at
        FROM contact_submissions
        ORDER BY created_at DESC
    `);

    return res.status(200).json({
        success: true,
        data: enquiries,
    });
});

export const getEnquiryById = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [enquiries] = await pool.query(
        `
        SELECT
            id,
            reference_number,
            name,
            phone,
            email,
            message,
            status,
            created_at,
            updated_at
        FROM contact_submissions
        WHERE id = ?
        LIMIT 1
        `,
        [id],
    );

    if (enquiries.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Enquiry not found.",
        });
    }

    return res.status(200).json({
        success: true,
        data: enquiries[0],
    });
});

export const updateEnquiryStatus = wrapAsync(
    async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required.",
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry status.",
            });
        }

        const [existingEnquiries] = await pool.query(
            `
            SELECT
                id
            FROM contact_submissions
            WHERE id = ?
            LIMIT 1
            `,
            [id],
        );

        if (existingEnquiries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found.",
            });
        }

        await pool.query(
            `
            UPDATE contact_submissions
            SET status = ?
            WHERE id = ?
            `,
            [status, id],
        );

        const [updatedEnquiries] = await pool.query(
            `
            SELECT
                id,
                reference_number,
                name,
                phone,
                email,
                message,
                status,
                created_at,
                updated_at
            FROM contact_submissions
            WHERE id = ?
            LIMIT 1
            `,
            [id],
        );

        return res.status(200).json({
            success: true,
            message: "Enquiry status updated successfully.",
            data: updatedEnquiries[0],
        });
    },
);
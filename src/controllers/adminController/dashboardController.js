import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

export const getDashboard = wrapAsync(async (req, res) => {
    const [
        [enquiryCounts],
        [applicationCounts],
        [applicationTypes],
        [recentApplications],
    ] = await Promise.all([
        pool.query(`
            SELECT
                COUNT(*) AS total,
                CAST(COALESCE(SUM(status = 'NEW'), 0) AS UNSIGNED) AS new,
                CAST(COALESCE(SUM(status = 'IN_PROGRESS'), 0) AS UNSIGNED) AS in_progress,
                CAST(COALESCE(SUM(status = 'RESOLVED'), 0) AS UNSIGNED) AS resolved,
                CAST(COALESCE(SUM(status = 'CLOSED'), 0) AS UNSIGNED) AS closed
            FROM contact_submissions
        `),

        pool.query(`
            SELECT
                COUNT(*) AS total,
                CAST(COALESCE(SUM(status = 'NEW'), 0) AS UNSIGNED) AS new,
                CAST(COALESCE(SUM(status = 'IN_PROGRESS'), 0) AS UNSIGNED) AS in_progress,
                CAST(COALESCE(SUM(status = 'RESOLVED'), 0) AS UNSIGNED) AS resolved,
                CAST(COALESCE(SUM(status = 'CLOSED'), 0) AS UNSIGNED) AS closed
            FROM applications
        `),

        pool.query(`
            SELECT
                application_type,
                COUNT(*) AS count
            FROM applications
            GROUP BY application_type
            ORDER BY count DESC
        `),

        pool.query(`
            SELECT
                id,
                reference_number,
                application_type,
                status,
                created_at
            FROM applications
            ORDER BY created_at DESC
            LIMIT 10
        `),
    ]);

    return res.status(200).json({
        success: true,
        data: {
            enquiries: enquiryCounts[0],
            applications: applicationCounts[0],
            applicationTypes,
            recentApplications,
        },
    });
});
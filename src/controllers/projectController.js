import pool from "../config/db.js";
import wrapAsync from "../utils/tryCatchWrapper.js";

export const getProjects = wrapAsync(async (req, res) => {
    const [projects] = await pool.query(
        `
        SELECT
            p.id,
            p.title,
            p.slug,
            p.theme,
            p.department_id,
            d.title AS department_name,
            p.status,
            p.geography,
            p.start_date,
            p.end_date,
            p.target_group,
            p.partners,
            p.summary,
            p.problem_statement,
            p.activities,
            p.outcomes,
            p.media_url,
            p.documents,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN departments d
            ON d.id = p.department_id
        ORDER BY
            p.created_at DESC,
            p.id DESC
        `
    );

    return res.status(200).json({
        success: true,
        projects,
    });
});

export const getProjectById = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [projects] = await pool.query(
        `
        SELECT
            p.id,
            p.title,
            p.slug,
            p.theme,
            p.department_id,
            d.title AS department_name,
            p.status,
            p.geography,
            p.start_date,
            p.end_date,
            p.target_group,
            p.partners,
            p.summary,
            p.problem_statement,
            p.activities,
            p.outcomes,
            p.media_url,
            p.documents,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN departments d
            ON d.id = p.department_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [id]
    );

    if (projects.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Project not found.",
        });
    }

    return res.status(200).json({
        success: true,
        project: projects[0],
    });
});

export const getProjectBySlug = wrapAsync(async (req, res) => {
    const { slug } = req.params;

    if (!slug) {
        return res.status(400).json({
            success: false,
            message: "Project slug is required.",
        });
    }

    const [projects] = await pool.query(
        `
        SELECT
            p.id,
            p.title,
            p.slug,
            p.theme,
            p.department_id,
            d.title AS department_name,
            p.status,
            p.geography,
            p.start_date,
            p.end_date,
            p.target_group,
            p.partners,
            p.summary,
            p.problem_statement,
            p.activities,
            p.outcomes,
            p.media_url,
            p.documents,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN departments d
            ON d.id = p.department_id
        WHERE p.slug = ?
        LIMIT 1
        `,
        [slug]
    );

    if (projects.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Project not found.",
        });
    }

    return res.status(200).json({
        success: true,
        project: projects[0],
    });
});
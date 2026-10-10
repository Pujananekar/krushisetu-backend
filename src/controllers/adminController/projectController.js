import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

const projectFields = `
    projects.id,
    projects.title,
    projects.slug,
    projects.theme,
    projects.department_id,
    projects.status,
    projects.geography,
    projects.start_date,
    projects.end_date,
    projects.target_group,
    projects.partners,
    projects.summary,
    projects.problem_statement,
    projects.activities,
    projects.outcomes,
    projects.media_url,
    projects.documents,
    projects.created_at,
    projects.updated_at
`

export const getProjects = wrapAsync(async (req, res) => {
    const [projects] = await pool.query(`
        SELECT
            ${projectFields},
            departments.title AS department_name
        FROM projects
        LEFT JOIN departments
            ON projects.department_id = departments.id
        ORDER BY projects.created_at DESC
    `)

    return res.status(200).json({
        success: true,
        projects,
    })
})

export const getProjectById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [projects] = await pool.query(
        `
            SELECT
                ${projectFields},
                departments.title AS department_name
            FROM projects
            LEFT JOIN departments
                ON projects.department_id = departments.id
            WHERE projects.id = ?
            LIMIT 1
        `,
        [id]
    )

    if (projects.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        })
    }

    return res.status(200).json({
        success: true,
        project: projects[0],
    })
})

export const createProject = wrapAsync(async (req, res) => {
    const {
        title,
        slug,
        theme,
        department_id,
        status,
        geography,
        start_date,
        end_date,
        target_group,
        partners,
        summary,
        problem_statement,
        activities,
        outcomes,
        media_url,
        documents,
    } = req.body

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Project title is required",
        })
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Project slug is required",
        })
    }

    const [existingSlug] = await pool.query(
        `
            SELECT id
            FROM projects
            WHERE slug = ?
            LIMIT 1
        `,
        [slug.trim()]
    )

    if (existingSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A project with this slug already exists",
        })
    }

    if (
        department_id !== null &&
        department_id !== undefined &&
        department_id !== ""
    ) {
        const [department] = await pool.query(
            `
                SELECT id
                FROM departments
                WHERE id = ?
                LIMIT 1
            `,
            [department_id]
        )

        if (department.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected department does not exist",
            })
        }
    }

    const allowedStatuses = [
        "PLANNING",
        "ACTIVE",
        "COMPLETED",
        "ON_HOLD",
    ]

    const projectStatus = status || "PLANNING"

    if (!allowedStatuses.includes(projectStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project status",
        })
    }

    if (
        start_date &&
        end_date &&
        new Date(end_date) < new Date(start_date)
    ) {
        return res.status(400).json({
            success: false,
            message: "End date cannot be earlier than start date",
        })
    }

    const [result] = await pool.query(
        `
            INSERT INTO projects (
                title,
                slug,
                theme,
                department_id,
                status,
                geography,
                start_date,
                end_date,
                target_group,
                partners,
                summary,
                problem_statement,
                activities,
                outcomes,
                media_url,
                documents
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            title.trim(),
            slug.trim(),
            theme?.trim() || null,
            department_id || null,
            projectStatus,
            geography?.trim() || null,
            start_date || null,
            end_date || null,
            target_group?.trim() || null,
            partners?.trim() || null,
            summary?.trim() || null,
            problem_statement?.trim() || null,
            activities?.trim() || null,
            outcomes?.trim() || null,
            media_url?.trim() || null,
            documents?.trim() || null,
        ]
    )

    const [projects] = await pool.query(
        `
            SELECT
                ${projectFields},
                departments.title AS department_name
            FROM projects
            LEFT JOIN departments
                ON projects.department_id = departments.id
            WHERE projects.id = ?
            LIMIT 1
        `,
        [result.insertId]
    )

    return res.status(201).json({
        success: true,
        message: "Project created successfully",
        project: projects[0],
    })
})

export const updateProject = wrapAsync(async (req, res) => {
    const { id } = req.params

    const {
        title,
        slug,
        theme,
        department_id,
        status,
        geography,
        start_date,
        end_date,
        target_group,
        partners,
        summary,
        problem_statement,
        activities,
        outcomes,
        media_url,
        documents,
    } = req.body

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Project title is required",
        })
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Project slug is required",
        })
    }

    const [existingProject] = await pool.query(
        `
            SELECT id
            FROM projects
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingProject.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        })
    }

    const [existingSlug] = await pool.query(
        `
            SELECT id
            FROM projects
            WHERE slug = ?
            AND id != ?
            LIMIT 1
        `,
        [slug.trim(), id]
    )

    if (existingSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A project with this slug already exists",
        })
    }

    if (
        department_id !== null &&
        department_id !== undefined &&
        department_id !== ""
    ) {
        const [department] = await pool.query(
            `
                SELECT id
                FROM departments
                WHERE id = ?
                LIMIT 1
            `,
            [department_id]
        )

        if (department.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected department does not exist",
            })
        }
    }

    const allowedStatuses = [
        "PLANNING",
        "ACTIVE",
        "COMPLETED",
        "ON_HOLD",
    ]

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project status",
        })
    }

    if (
        start_date &&
        end_date &&
        new Date(end_date) < new Date(start_date)
    ) {
        return res.status(400).json({
            success: false,
            message: "End date cannot be earlier than start date",
        })
    }

    await pool.query(
        `
            UPDATE projects
            SET
                title = ?,
                slug = ?,
                theme = ?,
                department_id = ?,
                status = ?,
                geography = ?,
                start_date = ?,
                end_date = ?,
                target_group = ?,
                partners = ?,
                summary = ?,
                problem_statement = ?,
                activities = ?,
                outcomes = ?,
                media_url = ?,
                documents = ?
            WHERE id = ?
        `,
        [
            title.trim(),
            slug.trim(),
            theme?.trim() || null,
            department_id || null,
            status,
            geography?.trim() || null,
            start_date || null,
            end_date || null,
            target_group?.trim() || null,
            partners?.trim() || null,
            summary?.trim() || null,
            problem_statement?.trim() || null,
            activities?.trim() || null,
            outcomes?.trim() || null,
            media_url?.trim() || null,
            documents?.trim() || null,
            id,
        ]
    )

    const [projects] = await pool.query(
        `
            SELECT
                ${projectFields},
                departments.title AS department_name
            FROM projects
            LEFT JOIN departments
                ON projects.department_id = departments.id
            WHERE projects.id = ?
            LIMIT 1
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        project: projects[0],
    })
})

export const deleteProject = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [existingProject] = await pool.query(
        `
            SELECT id
            FROM projects
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingProject.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        })
    }

    await pool.query(
        `
            DELETE FROM projects
            WHERE id = ?
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
    })
})
import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

const getResourceFields = `
    id,
    title,
    slug,
    resource_type,
    category,
    crop,
    season,
    language,
    body,
    file_url,
    video_url,
    external_url,
    author,
    reviewer,
    publication_date,
    last_updated_date,
    region,
    crop_applicability,
    tags,
    disclaimer,
    created_at,
    updated_at
`

export const getResources = wrapAsync(async (req, res) => {
    const [resources] = await pool.query(`
        SELECT
            ${getResourceFields}
        FROM resources
        ORDER BY publication_date DESC, id DESC
    `)

    return res.status(200).json({
        success: true,
        resources,
    })
})

export const getResourceById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [resources] = await pool.query(
        `
            SELECT
                ${getResourceFields}
            FROM resources
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (resources.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Resource not found.",
        })
    }

    return res.status(200).json({
        success: true,
        resource: resources[0],
    })
})

export const createResource = wrapAsync(async (req, res) => {
    const {
        title,
        slug,
        resource_type,
        category,
        crop,
        season,
        language,
        body,
        file_url,
        video_url,
        external_url,
        author,
        reviewer,
        publication_date,
        last_updated_date,
        region,
        crop_applicability,
        tags,
        disclaimer,
    } = req.body

    if (
        !title ||
        !slug ||
        !resource_type ||
        !category ||
        !language
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Title, slug, resource type, category and language are required.",
        })
    }

    const [existingResource] = await pool.query(
        `
            SELECT id
            FROM resources
            WHERE slug = ?
            LIMIT 1
        `,
        [slug]
    )

    if (existingResource.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A resource with this slug already exists.",
        })
    }

    const [result] = await pool.query(
        `
            INSERT INTO resources (
                title,
                slug,
                resource_type,
                category,
                crop,
                season,
                language,
                body,
                file_url,
                video_url,
                external_url,
                author,
                reviewer,
                publication_date,
                last_updated_date,
                region,
                crop_applicability,
                tags,
                disclaimer
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            title,
            slug,
            resource_type,
            category,
            crop || null,
            season || null,
            language,
            body || null,
            file_url || null,
            video_url || null,
            external_url || null,
            author || null,
            reviewer || null,
            publication_date || null,
            last_updated_date || null,
            region || null,
            crop_applicability || null,
            tags || null,
            disclaimer || null,
        ]
    )

    const [resources] = await pool.query(
        `
            SELECT
                ${getResourceFields}
            FROM resources
            WHERE id = ?
            LIMIT 1
        `,
        [result.insertId]
    )

    return res.status(201).json({
        success: true,
        message: "Resource created successfully.",
        resource: resources[0],
    })
})

export const updateResource = wrapAsync(async (req, res) => {
    const { id } = req.params

    const {
        title,
        slug,
        resource_type,
        category,
        crop,
        season,
        language,
        body,
        file_url,
        video_url,
        external_url,
        author,
        reviewer,
        publication_date,
        last_updated_date,
        region,
        crop_applicability,
        tags,
        disclaimer,
    } = req.body

    if (
        !title ||
        !slug ||
        !resource_type ||
        !category ||
        !language
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Title, slug, resource type, category and language are required.",
        })
    }

    const [existingResource] = await pool.query(
        `
            SELECT id
            FROM resources
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingResource.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Resource not found.",
        })
    }

    const [duplicateSlug] = await pool.query(
        `
            SELECT id
            FROM resources
            WHERE slug = ?
            AND id != ?
            LIMIT 1
        `,
        [slug, id]
    )

    if (duplicateSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "Another resource already uses this slug.",
        })
    }

    await pool.query(
        `
            UPDATE resources
            SET
                title = ?,
                slug = ?,
                resource_type = ?,
                category = ?,
                crop = ?,
                season = ?,
                language = ?,
                body = ?,
                file_url = ?,
                video_url = ?,
                external_url = ?,
                author = ?,
                reviewer = ?,
                publication_date = ?,
                last_updated_date = ?,
                region = ?,
                crop_applicability = ?,
                tags = ?,
                disclaimer = ?
            WHERE id = ?
        `,
        [
            title,
            slug,
            resource_type,
            category,
            crop || null,
            season || null,
            language,
            body || null,
            file_url || null,
            video_url || null,
            external_url || null,
            author || null,
            reviewer || null,
            publication_date || null,
            last_updated_date || null,
            region || null,
            crop_applicability || null,
            tags || null,
            disclaimer || null,
            id,
        ]
    )

    const [resources] = await pool.query(
        `
            SELECT
                ${getResourceFields}
            FROM resources
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Resource updated successfully.",
        resource: resources[0],
    })
})

export const deleteResource = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [existingResource] = await pool.query(
        `
            SELECT id
            FROM resources
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingResource.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Resource not found.",
        })
    }

    await pool.query(
        `
            DELETE FROM resources
            WHERE id = ?
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Resource deleted successfully.",
    })
})
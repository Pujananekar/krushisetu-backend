import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

const successStoryFields = `
    success_stories.id,
    success_stories.title,
    success_stories.slug,
    success_stories.beneficiary_name,
    success_stories.location,
    success_stories.story,
    success_stories.outcomes,
    success_stories.quote,
    success_stories.media_url,
    success_stories.consent_status,
    success_stories.publish_permission,
    success_stories.status,
    success_stories.created_at,
    success_stories.updated_at
`

export const getSuccessStoriess = wrapAsync(
    async (req, res) => {
        const [stories] = await pool.query(`
            SELECT
                ${successStoryFields}
            FROM success_stories
            ORDER BY success_stories.created_at DESC
        `)

        return res.status(200).json({
            success: true,
            successStories: stories,
        })
    }
)

export const getSuccessStoryByIdd = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const [stories] = await pool.query(
            `
            SELECT
                ${successStoryFields}
            FROM success_stories
            WHERE success_stories.id = ?
            LIMIT 1
            `,
            [id]
        )

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Success story not found",
            })
        }

        return res.status(200).json({
            success: true,
            successStory: stories[0],
        })
    }
)

export const createSuccessStoryy = wrapAsync(
    async (req, res) => {
        const {
            title,
            slug,
            beneficiary_name,
            location,
            story,
            outcomes,
            quote,
            media_url,
            consent_status,
            publish_permission,
            status,
        } = req.body

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            })
        }

        if (!slug?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Slug is required",
            })
        }

        if (!story?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Story is required",
            })
        }

        const [existing] = await pool.query(
            `
            SELECT id
            FROM success_stories
            WHERE slug = ?
            LIMIT 1
            `,
            [slug.trim()]
        )

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A success story with this slug already exists",
            })
        }

        const finalConsentStatus =
            consent_status || "PENDING"

        const finalStatus = status || "DRAFT"

        const finalPublishPermission =
            publish_permission === true ||
            publish_permission === 1 ||
            publish_permission === "1"
                ? 1
                : 0

        const [result] = await pool.query(
            `
            INSERT INTO success_stories (
                title,
                slug,
                beneficiary_name,
                location,
                story,
                outcomes,
                quote,
                media_url,
                consent_status,
                publish_permission,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                title.trim(),
                slug.trim(),
                beneficiary_name?.trim() || null,
                location?.trim() || null,
                story.trim(),
                outcomes?.trim() || null,
                quote?.trim() || null,
                media_url?.trim() || null,
                finalConsentStatus,
                finalPublishPermission,
                finalStatus,
            ]
        )

        const [stories] = await pool.query(
            `
            SELECT
                ${successStoryFields}
            FROM success_stories
            WHERE success_stories.id = ?
            `,
            [result.insertId]
        )

        return res.status(201).json({
            success: true,
            message: "Success story created successfully",
            successStory: stories[0],
        })
    }
)

export const updateSuccessStoryy = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const {
            title,
            slug,
            beneficiary_name,
            location,
            story,
            outcomes,
            quote,
            media_url,
            consent_status,
            publish_permission,
            status,
        } = req.body

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            })
        }

        if (!slug?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Slug is required",
            })
        }

        if (!story?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Story is required",
            })
        }

        const [existing] = await pool.query(
            `
            SELECT id
            FROM success_stories
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        )

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Success story not found",
            })
        }

        const [duplicateSlug] = await pool.query(
            `
            SELECT id
            FROM success_stories
            WHERE slug = ?
            AND id != ?
            LIMIT 1
            `,
            [slug.trim(), id]
        )

        if (duplicateSlug.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A success story with this slug already exists",
            })
        }

        const finalConsentStatus =
            consent_status || "PENDING"

        const finalStatus = status || "DRAFT"

        const finalPublishPermission =
            publish_permission === true ||
            publish_permission === 1 ||
            publish_permission === "1"
                ? 1
                : 0

        await pool.query(
            `
            UPDATE success_stories
            SET
                title = ?,
                slug = ?,
                beneficiary_name = ?,
                location = ?,
                story = ?,
                outcomes = ?,
                quote = ?,
                media_url = ?,
                consent_status = ?,
                publish_permission = ?,
                status = ?
            WHERE id = ?
            `,
            [
                title.trim(),
                slug.trim(),
                beneficiary_name?.trim() || null,
                location?.trim() || null,
                story.trim(),
                outcomes?.trim() || null,
                quote?.trim() || null,
                media_url?.trim() || null,
                finalConsentStatus,
                finalPublishPermission,
                finalStatus,
                id,
            ]
        )

        const [stories] = await pool.query(
            `
            SELECT
                ${successStoryFields}
            FROM success_stories
            WHERE success_stories.id = ?
            `,
            [id]
        )

        return res.status(200).json({
            success: true,
            message: "Success story updated successfully",
            successStory: stories[0],
        })
    }
)

export const deleteSuccessStoryy = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const [existing] = await pool.query(
            `
            SELECT id
            FROM success_stories
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        )

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Success story not found",
            })
        }

        await pool.query(
            `
            DELETE FROM success_stories
            WHERE id = ?
            `,
            [id]
        )

        return res.status(200).json({
            success: true,
            message: "Success story deleted successfully",
        })
    }
)
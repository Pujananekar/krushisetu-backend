import pool from "../config/db.js"
import wrapAsync from "../utils/tryCatchWrapper.js"


export const getPublicSuccessStories = wrapAsync(
    async (req, res) => {
        const [stories] = await pool.query(`
            SELECT
                id,
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
                created_at,
                updated_at
            FROM success_stories
            WHERE
                status = 'PUBLISHED'
                AND publish_permission = 1
                AND consent_status IN ('RECEIVED', 'NOT_REQUIRED')
            ORDER BY
                created_at DESC,
                id DESC
        `)

        return res.status(200).json({
            success: true,
            successStories: stories,
        })
    }
)

export const getPublicSuccessStoryBySlug = wrapAsync(
    async (req, res) => {
        const { slug } = req.params

        const [stories] = await pool.query(
            `
            SELECT
                id,
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
                created_at,
                updated_at
            FROM success_stories
            WHERE
                slug = ?
                AND status = 'PUBLISHED'
                AND publish_permission = 1
                AND consent_status IN ('RECEIVED', 'NOT_REQUIRED')
            LIMIT 1
            `,
            [slug]
        )

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Success story not found.",
            })
        }

        return res.status(200).json({
            success: true,
            successStory: stories[0],
        })
    }
)
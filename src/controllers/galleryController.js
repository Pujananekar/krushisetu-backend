import pool from "../config/db.js"
import wrapAsync from "../utils/tryCatchWrapper.js"



const mediaFields = `
    id,
    title,
    slug,
    media_type,
    file_url,
    thumbnail_url,
    alt_text,
    caption,
    credit,
    consent_status,
    album,
    language,
    width,
    height,
    file_size,
    status,
    featured,
    display_order,
    created_at,
    updated_at
`


export const getPublicGallery = wrapAsync(
    async (req, res) => {
        const {
            media_type,
            album,
            featured,
            search,
        } = req.query


        const conditions = [
            `status = 'PUBLISHED'`,
            `
            consent_status IN (
                'APPROVED',
                'NOT_REQUIRED'
            )
            `,
        ]

        const values = []


        if (media_type) {
            conditions.push(
                `media_type = ?`
            )

            values.push(
                String(media_type).toUpperCase()
            )
        }


        if (album) {
            conditions.push(
                `album = ?`
            )

            values.push(album.trim())
        }


        if (
            featured !== undefined &&
            featured !== ""
        ) {
            conditions.push(
                `featured = ?`
            )

            values.push(
                featured === "true" ||
                featured === "1"
                    ? 1
                    : 0
            )
        }


        if (search?.trim()) {
            conditions.push(
                `
                (
                    title LIKE ?
                    OR caption LIKE ?
                    OR alt_text LIKE ?
                    OR album LIKE ?
                )
                `
            )

            const searchValue =
                `%${search.trim()}%`

            values.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            )
        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : ""


        const [media] = await pool.query(
            `
            SELECT
                ${mediaFields}
            FROM media
            ${whereClause}
            ORDER BY
                featured DESC,
                display_order ASC,
                created_at DESC,
                id DESC
            `,
            values
        )


        return res.status(200).json({
            success: true,
            media,
            count: media.length,
        })
    }
)


export const getPublicGalleryBySlug =
    wrapAsync(async (req, res) => {
        const { slug } = req.params


        const [media] = await pool.query(
            `
            SELECT
                ${mediaFields}
            FROM media
            WHERE slug = ?
                AND status = 'PUBLISHED'
                AND consent_status IN (
                    'APPROVED',
                    'NOT_REQUIRED'
                )
            LIMIT 1
            `,
            [slug]
        )


        if (media.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Gallery media not found.",
            })
        }


        return res.status(200).json({
            success: true,
            media: media[0],
        })
    })
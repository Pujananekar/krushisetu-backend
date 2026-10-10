import pool from "../config/db.js"
import wrapAsync from "../utils/tryCatchWrapper.js"


export const getPublicNews = wrapAsync(async (req, res) => {
    const [news] = await pool.query(`
        SELECT
            id,
            title,
            slug,
            summary,
            content,
            category,
            author,
            image_url,
            published_date
        FROM news
        WHERE status = 'PUBLISHED'
        ORDER BY published_date DESC, id DESC
    `)

    return res.status(200).json({
        success: true,
        news,
    })
})


export const getPublicNewsBySlug = wrapAsync(async (req, res) => {
    const { slug } = req.params

    const [news] = await pool.query(
        `
        SELECT
            id,
            title,
            slug,
            summary,
            content,
            category,
            author,
            image_url,
            published_date
        FROM news
        WHERE slug = ?
          AND status = 'PUBLISHED'
        LIMIT 1
        `,
        [slug]
    )

    if (news.length === 0) {
        return res.status(404).json({
            success: false,
            message: "News update not found.",
        })
    }

    return res.status(200).json({
        success: true,
        news: news[0],
    })
})
import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

export const getNews = wrapAsync(async (req, res) => {
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
            published_date,
            status,
            created_at,
            updated_at
        FROM news
        ORDER BY created_at DESC
    `);

    return res.status(200).json({
        success: true,
        news
    });
});

export const getNewsById = wrapAsync(async (req, res) => {
    const { id } = req.params;

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
            published_date,
            status,
            created_at,
            updated_at
        FROM news
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (news.length === 0) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
    }

    return res.status(200).json({
        success: true,
        news: news[0]
    });
});

export const createNews = wrapAsync(async (req, res) => {
    const {
        title,
        slug,
        summary,
        content,
        category,
        author,
        image_url,
        published_date,
        status
    } = req.body;

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Slug is required"
        });
    }

    if (!content?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Content is required"
        });
    }

    const finalStatus =
        status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const [result] = await pool.query(
        `
        INSERT INTO news (
            title,
            slug,
            summary,
            content,
            category,
            author,
            image_url,
            published_date,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            title.trim(),
            slug.trim(),
            summary?.trim() || null,
            content.trim(),
            category?.trim() || null,
            author?.trim() || null,
            image_url?.trim() || null,
            published_date || null,
            finalStatus
        ]
    );

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
            published_date,
            status,
            created_at,
            updated_at
        FROM news
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
    );

    return res.status(201).json({
        success: true,
        message: "News created successfully",
        news: news[0]
    });
});

export const updateNews = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const {
        title,
        slug,
        summary,
        content,
        category,
        author,
        image_url,
        published_date,
        status
    } = req.body;

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Slug is required"
        });
    }

    if (!content?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Content is required"
        });
    }

    const finalStatus =
        status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const [result] = await pool.query(
        `
        UPDATE news
        SET
            title = ?,
            slug = ?,
            summary = ?,
            content = ?,
            category = ?,
            author = ?,
            image_url = ?,
            published_date = ?,
            status = ?
        WHERE id = ?
        `,
        [
            title.trim(),
            slug.trim(),
            summary?.trim() || null,
            content.trim(),
            category?.trim() || null,
            author?.trim() || null,
            image_url?.trim() || null,
            published_date || null,
            finalStatus,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
    }

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
            published_date,
            status,
            created_at,
            updated_at
        FROM news
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return res.status(200).json({
        success: true,
        message: "News updated successfully",
        news: news[0]
    });
});

export const deleteNews = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [result] = await pool.query(
        `DELETE FROM news WHERE id = ?`,
        [id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
    }

    return res.status(200).json({
        success: true,
        message: "News deleted successfully"
    });
});
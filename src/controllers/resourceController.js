import pool from "../config/db.js";
import wrapAsync from "../utils/tryCatchWrapper.js";


export const getPublicResources = wrapAsync(async (req, res) => {
    const [resources] = await pool.query(
        `
        SELECT
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
            disclaimer
        FROM resources
        ORDER BY
            publication_date DESC,
            id DESC
        `
    );

    return res.status(200).json({
        success: true,
        resources,
    });
});

export const getPublicResourceBySlug = wrapAsync(
    async (req, res) => {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Resource slug is required.",
            });
        }

        const [resources] = await pool.query(
            `
            SELECT
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
                disclaimer
            FROM resources
            WHERE slug = ?
            LIMIT 1
            `,
            [slug]
        );

        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found.",
            });
        }

        return res.status(200).json({
            success: true,
            resource: resources[0],
        });
    }
);
import pool from "../../config/db.js";
import wrapAsync from "../../utils/tryCatchWrapper.js";

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
`;

export const getGallery = wrapAsync(async (req, res) => {
    const [media] = await pool.query(`
        SELECT
            ${mediaFields}
        FROM media
        ORDER BY display_order ASC, created_at DESC
    `);

    return res.status(200).json({
        success: true,
        media,
    });
});

export const getGalleryById = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [media] = await pool.query(
        `
        SELECT
            ${mediaFields}
        FROM media
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (media.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Media not found",
        });
    }

    return res.status(200).json({
        success: true,
        media: media[0],
    });
});

export const createGallery = wrapAsync(async (req, res) => {
    const {
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
    } = req.body;

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Media title is required",
        });
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Media slug is required",
        });
    }

    if (!media_type) {
        return res.status(400).json({
            success: false,
            message: "Media type is required",
        });
    }

    const mediaType = String(media_type).toUpperCase();

    const allowedMediaTypes = [
        "IMAGE",
        "VIDEO",
    ];

    if (!allowedMediaTypes.includes(mediaType)) {
        return res.status(400).json({
            success: false,
            message: "Invalid media type",
        });
    }

    const [existingSlug] = await pool.query(
        `
        SELECT id
        FROM media
        WHERE slug = ?
        LIMIT 1
        `,
        [slug.trim()]
    );

    if (existingSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A media item with this slug already exists",
        });
    }

    const allowedConsentStatuses = [
        "PENDING",
        "APPROVED",
        "NOT_REQUIRED",
    ];

    const consentStatus = consent_status
        ? String(consent_status).toUpperCase()
        : "PENDING";

    if (!allowedConsentStatuses.includes(consentStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid consent status",
        });
    }

    const allowedStatuses = [
        "PUBLISHED",
        "DRAFT",
        "IN_REVIEW",
        "ARCHIVED",
    ];

    const mediaStatus = status
        ? String(status).toUpperCase()
        : "DRAFT";

    if (!allowedStatuses.includes(mediaStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid media status",
        });
    }

    const mediaFeatured =
        featured === true ||
        featured === 1 ||
        featured === "1" ||
        featured === "true";

    const mediaDisplayOrder =
        display_order === undefined ||
        display_order === null ||
        display_order === ""
            ? 0
            : Number(display_order);

    if (
        !Number.isInteger(mediaDisplayOrder) ||
        mediaDisplayOrder < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Display order must be a non-negative integer",
        });
    }

    const [result] = await pool.query(
        `
        INSERT INTO media (
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
            display_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            title.trim(),
            slug.trim(),
            mediaType,
            file_url?.trim() || null,
            thumbnail_url?.trim() || null,
            alt_text?.trim() || null,
            caption?.trim() || null,
            credit?.trim() || null,
            consentStatus,
            album?.trim() || null,
            language?.trim() || "English",
            width || null,
            height || null,
            file_size || null,
            mediaStatus,
            mediaFeatured,
            mediaDisplayOrder,
        ]
    );

    const [media] = await pool.query(
        `
        SELECT
            ${mediaFields}
        FROM media
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
    );

    return res.status(201).json({
        success: true,
        message: "Media created successfully",
        media: media[0],
    });
});

export const updateGallery = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const {
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
    } = req.body;

    if (!title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Media title is required",
        });
    }

    if (!slug?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Media slug is required",
        });
    }

    if (!media_type) {
        return res.status(400).json({
            success: false,
            message: "Media type is required",
        });
    }

    const mediaType = String(media_type).toUpperCase();

    const allowedMediaTypes = [
        "IMAGE",
        "VIDEO",
    ];

    if (!allowedMediaTypes.includes(mediaType)) {
        return res.status(400).json({
            success: false,
            message: "Invalid media type",
        });
    }

    const [existingMedia] = await pool.query(
        `
        SELECT id
        FROM media
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (existingMedia.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Media not found",
        });
    }

    const [existingSlug] = await pool.query(
        `
        SELECT id
        FROM media
        WHERE slug = ?
        AND id != ?
        LIMIT 1
        `,
        [slug.trim(), id]
    );

    if (existingSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A media item with this slug already exists",
        });
    }

    const allowedConsentStatuses = [
        "PENDING",
        "APPROVED",
        "NOT_REQUIRED",
    ];

    const consentStatus = consent_status
        ? String(consent_status).toUpperCase()
        : "PENDING";

    if (!allowedConsentStatuses.includes(consentStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid consent status",
        });
    }

    const allowedStatuses = [
        "PUBLISHED",
        "DRAFT",
        "IN_REVIEW",
        "ARCHIVED",
    ];

    const mediaStatus = status
        ? String(status).toUpperCase()
        : "DRAFT";

    if (!allowedStatuses.includes(mediaStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid media status",
        });
    }

    const mediaFeatured =
        featured === true ||
        featured === 1 ||
        featured === "1" ||
        featured === "true";

    const mediaDisplayOrder =
        display_order === undefined ||
        display_order === null ||
        display_order === ""
            ? 0
            : Number(display_order);

    if (
        !Number.isInteger(mediaDisplayOrder) ||
        mediaDisplayOrder < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Display order must be a non-negative integer",
        });
    }

    await pool.query(
        `
        UPDATE media
        SET
            title = ?,
            slug = ?,
            media_type = ?,
            file_url = ?,
            thumbnail_url = ?,
            alt_text = ?,
            caption = ?,
            credit = ?,
            consent_status = ?,
            album = ?,
            language = ?,
            width = ?,
            height = ?,
            file_size = ?,
            status = ?,
            featured = ?,
            display_order = ?
        WHERE id = ?
        `,
        [
            title.trim(),
            slug.trim(),
            mediaType,
            file_url?.trim() || null,
            thumbnail_url?.trim() || null,
            alt_text?.trim() || null,
            caption?.trim() || null,
            credit?.trim() || null,
            consentStatus,
            album?.trim() || null,
            language?.trim() || "English",
            width || null,
            height || null,
            file_size || null,
            mediaStatus,
            mediaFeatured,
            mediaDisplayOrder,
            id,
        ]
    );

    const [media] = await pool.query(
        `
        SELECT
            ${mediaFields}
        FROM media
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return res.status(200).json({
        success: true,
        message: "Media updated successfully",
        media: media[0],
    });
});

export const deleteGallery = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const [result] = await pool.query(
        `
        DELETE FROM media
        WHERE id = ?
        `,
        [id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Media not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Media deleted successfully",
    });
});
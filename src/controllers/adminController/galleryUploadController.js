import wrapAsync from "../../utils/tryCatchWrapper.js";

export const uploadGalleryMedia = wrapAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please select a file to upload.",
        });
    }

    const file = req.file;

    let mediaType = null;

    if (file.mimetype.startsWith("image/")) {
        mediaType = "IMAGE";
    } else if (file.mimetype.startsWith("video/")) {
        mediaType = "VIDEO";
    }

    if (!mediaType) {
        return res.status(400).json({
            success: false,
            message: "Unsupported media type.",
        });
    }

    const fileUrl = `/uploads/gallery/${file.filename}`;

    return res.status(201).json({
        success: true,
        message: "Media uploaded successfully.",

        file: {
            originalName: file.originalname,
            fileName: file.filename,
            fileUrl,

            mediaType,
            mimeType: file.mimetype,

            fileSize: file.size,
            fileSizeBytes: file.size,
        },
    });
});
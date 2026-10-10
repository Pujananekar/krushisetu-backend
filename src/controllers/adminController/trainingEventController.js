import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

const getTrainingEventFields = `
    id,
    title,
    slug,
    description,
    training_type,
    start_date,
    end_date,
    start_time,
    end_time,
    venue,
    location,
    organiser,
    trainer,
    capacity,
    registration_open,
    registration_close,
    status,
    registration_enabled,
    created_at,
    updated_at
`

export const getTrainingEvents = wrapAsync(async (req, res) => {
    const [trainingEvents] = await pool.query(`
        SELECT
            ${getTrainingEventFields}
        FROM training_events
        ORDER BY start_date ASC, id DESC
    `)

    return res.status(200).json({
        success: true,
        trainingEvents,
    })
})

export const getTrainingEventById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [trainingEvents] = await pool.query(
        `
            SELECT
                ${getTrainingEventFields}
            FROM training_events
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (trainingEvents.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Training event not found.",
        })
    }

    return res.status(200).json({
        success: true,
        trainingEvent: trainingEvents[0],
    })
})

export const createTrainingEvent = wrapAsync(async (req, res) => {
    const {
        title,
        slug,
        description,
        training_type,
        start_date,
        end_date,
        start_time,
        end_time,
        venue,
        location,
        organiser,
        trainer,
        capacity,
        registration_open,
        registration_close,
        status,
        registration_enabled,
    } = req.body

    if (
        !title ||
        !slug ||
        !description ||
        !training_type ||
        !start_date
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Title, slug, description, training type and start date are required.",
        })
    }

    const [existingEvent] = await pool.query(
        `
            SELECT id
            FROM training_events
            WHERE slug = ?
            LIMIT 1
        `,
        [slug]
    )

    if (existingEvent.length > 0) {
        return res.status(409).json({
            success: false,
            message:
                "A training event with this slug already exists.",
        })
    }

    const [result] = await pool.query(
        `
            INSERT INTO training_events (
                title,
                slug,
                description,
                training_type,
                start_date,
                end_date,
                start_time,
                end_time,
                venue,
                location,
                organiser,
                trainer,
                capacity,
                registration_open,
                registration_close,
                status,
                registration_enabled
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            title,
            slug,
            description,
            training_type,
            start_date,
            end_date || null,
            start_time || null,
            end_time || null,
            venue || null,
            location || null,
            organiser || null,
            trainer || null,
            capacity || null,
            registration_open || null,
            registration_close || null,
            status || "UPCOMING",
            registration_enabled ?? 1,
        ]
    )

    const [trainingEvents] = await pool.query(
        `
            SELECT
                ${getTrainingEventFields}
            FROM training_events
            WHERE id = ?
            LIMIT 1
        `,
        [result.insertId]
    )

    return res.status(201).json({
        success: true,
        message: "Training event created successfully.",
        trainingEvent: trainingEvents[0],
    })
})

export const updateTrainingEvent = wrapAsync(async (req, res) => {
    const { id } = req.params

    const {
        title,
        slug,
        description,
        training_type,
        start_date,
        end_date,
        start_time,
        end_time,
        venue,
        location,
        organiser,
        trainer,
        capacity,
        registration_open,
        registration_close,
        status,
        registration_enabled,
    } = req.body

    if (
        !title ||
        !slug ||
        !description ||
        !training_type ||
        !start_date
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Title, slug, description, training type and start date are required.",
        })
    }

    const [existingEvent] = await pool.query(
        `
            SELECT id
            FROM training_events
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingEvent.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Training event not found.",
        })
    }

    const [duplicateSlug] = await pool.query(
        `
            SELECT id
            FROM training_events
            WHERE slug = ?
            AND id != ?
            LIMIT 1
        `,
        [slug, id]
    )

    if (duplicateSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message:
                "Another training event already uses this slug.",
        })
    }

    await pool.query(
        `
            UPDATE training_events
            SET
                title = ?,
                slug = ?,
                description = ?,
                training_type = ?,
                start_date = ?,
                end_date = ?,
                start_time = ?,
                end_time = ?,
                venue = ?,
                location = ?,
                organiser = ?,
                trainer = ?,
                capacity = ?,
                registration_open = ?,
                registration_close = ?,
                status = ?,
                registration_enabled = ?
            WHERE id = ?
        `,
        [
            title,
            slug,
            description,
            training_type,
            start_date,
            end_date || null,
            start_time || null,
            end_time || null,
            venue || null,
            location || null,
            organiser || null,
            trainer || null,
            capacity || null,
            registration_open || null,
            registration_close || null,
            status || "UPCOMING",
            registration_enabled ?? 1,
            id,
        ]
    )

    const [trainingEvents] = await pool.query(
        `
            SELECT
                ${getTrainingEventFields}
            FROM training_events
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Training event updated successfully.",
        trainingEvent: trainingEvents[0],
    })
})

export const deleteTrainingEvent = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [existingEvent] = await pool.query(
        `
            SELECT id
            FROM training_events
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingEvent.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Training event not found.",
        })
    }

    await pool.query(
        `
            DELETE FROM training_events
            WHERE id = ?
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Training event deleted successfully.",
    })
})
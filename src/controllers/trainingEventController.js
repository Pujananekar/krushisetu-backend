import pool from "../config/db.js";
import wrapAsync from "../utils/tryCatchWrapper.js";


const getTrainingEventFields = "id,title,slug,description,training_type,start_date,end_date,start_time,end_time,venue,location,organiser,trainer,capacity,registration_open,registration_close,status,registration_enabled";

export const getTrainingEvents = wrapAsync(async (req, res) => {
    const [trainingEvents] = await pool.query(`
        SELECT 
            ${getTrainingEventFields}
        FROM training_events
        ORDER BY start_date ASC, id DESC
        `)

    return res.status(200).json({
        success: true,
        trainingEvents
    })
})

export const getTrainingEventBySlug = wrapAsync(
    async (req, res) => {
        const { slug } = req.params

        const [trainingEvents] = await pool.query(
            `
                SELECT
                    ${getTrainingEventFields}
                FROM training_events
                WHERE slug = ?
                LIMIT 1
            `,
            [slug]
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
    }
)
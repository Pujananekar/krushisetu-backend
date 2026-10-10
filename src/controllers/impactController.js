import pool from "../config/db.js"
import wrapAsync from "../utils/tryCatchWrapper.js"


export const getPublicImpactIndicators = wrapAsync(
    async (req, res) => {
        const [indicators] = await pool.query(`
            SELECT
                impact_indicators.id,
                impact_indicators.project_id,
                impact_indicators.department_id,
                impact_indicators.indicator_name,
                impact_indicators.value,
                impact_indicators.unit,
                impact_indicators.period_from,
                impact_indicators.period_to,
                impact_indicators.location,
                impact_indicators.evidence_note,
                projects.title AS project_name,
                projects.slug AS project_slug,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            WHERE impact_indicators.approval_status = 'APPROVED'
            ORDER BY
                impact_indicators.period_to DESC,
                impact_indicators.id DESC
        `)

        return res.status(200).json({
            success: true,
            impactIndicators: indicators,
        })
    }
)

export const getPublicImpactIndicatorById = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const [indicators] = await pool.query(
            `
            SELECT
                impact_indicators.id,
                impact_indicators.project_id,
                impact_indicators.department_id,
                impact_indicators.indicator_name,
                impact_indicators.value,
                impact_indicators.unit,
                impact_indicators.period_from,
                impact_indicators.period_to,
                impact_indicators.location,
                impact_indicators.evidence_note,
                projects.title AS project_name,
                projects.slug AS project_slug,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            WHERE
                impact_indicators.id = ?
                AND impact_indicators.approval_status = 'APPROVED'
            LIMIT 1
            `,
            [id]
        )

        if (indicators.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Impact indicator not found.",
            })
        }

        return res.status(200).json({
            success: true,
            impactIndicator: indicators[0],
        })
    }
)
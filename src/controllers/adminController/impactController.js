import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"


const impactFields = `
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
    impact_indicators.approval_status,
    impact_indicators.notes,
    impact_indicators.created_at,
    impact_indicators.updated_at
`

export const getImpactIndicators = wrapAsync(
    async (req, res) => {
        const [indicators] = await pool.query(`
            SELECT
                ${impactFields},
                projects.title AS project_name,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            ORDER BY impact_indicators.created_at DESC
        `)

        return res.status(200).json({
            success: true,
            impactIndicators: indicators,
        })
    }
)

export const getImpactIndicatorById = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const [indicators] = await pool.query(
            `
            SELECT
                ${impactFields},
                projects.title AS project_name,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            WHERE impact_indicators.id = ?
            LIMIT 1
            `,
            [id]
        )

        if (indicators.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Impact indicator not found",
            })
        }

        return res.status(200).json({
            success: true,
            impactIndicator: indicators[0],
        })
    }
)

export const createImpactIndicator = wrapAsync(
    async (req, res) => {
        const {
            project_id,
            department_id,
            indicator_name,
            value,
            unit,
            period_from,
            period_to,
            location,
            evidence_note,
            approval_status,
            notes,
        } = req.body

        if (
            !indicator_name ||
            value === undefined ||
            value === null ||
            !unit
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Indicator name, value and unit are required",
            })
        }

        const [result] = await pool.query(
            `
            INSERT INTO impact_indicators (
                project_id,
                department_id,
                indicator_name,
                value,
                unit,
                period_from,
                period_to,
                location,
                evidence_note,
                approval_status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                project_id || null,
                department_id || null,
                indicator_name.trim(),
                value,
                unit.trim(),
                period_from || null,
                period_to || null,
                location?.trim() || null,
                evidence_note?.trim() || null,
                approval_status || "DRAFT",
                notes?.trim() || null,
            ]
        )

        const [indicators] = await pool.query(
            `
            SELECT
                ${impactFields},
                projects.title AS project_name,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            WHERE impact_indicators.id = ?
            `,
            [result.insertId]
        )

        return res.status(201).json({
            success: true,
            message: "Impact indicator created successfully",
            impactIndicator: indicators[0],
        })
    }
)

export const updateImpactIndicator = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const {
            project_id,
            department_id,
            indicator_name,
            value,
            unit,
            period_from,
            period_to,
            location,
            evidence_note,
            approval_status,
            notes,
        } = req.body

        if (
            !indicator_name ||
            value === undefined ||
            value === null ||
            !unit
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Indicator name, value and unit are required",
            })
        }

        const [existing] = await pool.query(
            `
            SELECT id
            FROM impact_indicators
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        )

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Impact indicator not found",
            })
        }

        await pool.query(
            `
            UPDATE impact_indicators
            SET
                project_id = ?,
                department_id = ?,
                indicator_name = ?,
                value = ?,
                unit = ?,
                period_from = ?,
                period_to = ?,
                location = ?,
                evidence_note = ?,
                approval_status = ?,
                notes = ?
            WHERE id = ?
            `,
            [
                project_id || null,
                department_id || null,
                indicator_name.trim(),
                value,
                unit.trim(),
                period_from || null,
                period_to || null,
                location?.trim() || null,
                evidence_note?.trim() || null,
                approval_status || "DRAFT",
                notes?.trim() || null,
                id,
            ]
        )

        const [indicators] = await pool.query(
            `
            SELECT
                ${impactFields},
                projects.title AS project_name,
                departments.title AS department_name
            FROM impact_indicators
            LEFT JOIN projects
                ON impact_indicators.project_id = projects.id
            LEFT JOIN departments
                ON impact_indicators.department_id = departments.id
            WHERE impact_indicators.id = ?
            `,
            [id]
        )

        return res.status(200).json({
            success: true,
            message: "Impact indicator updated successfully",
            impactIndicator: indicators[0],
        })
    }
)

export const deleteImpactIndicator = wrapAsync(
    async (req, res) => {
        const { id } = req.params

        const [existing] = await pool.query(
            `
            SELECT id
            FROM impact_indicators
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        )

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Impact indicator not found",
            })
        }

        await pool.query(
            `
            DELETE FROM impact_indicators
            WHERE id = ?
            `,
            [id]
        )

        return res.status(200).json({
            success: true,
            message: "Impact indicator deleted successfully",
        })
    }
)
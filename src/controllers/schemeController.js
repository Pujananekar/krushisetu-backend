import pool from "../config/db.js"
import wrapAsync from "../utils/tryCatchWrapper.js"

const schemeFields = `
    id,
    name,
    slug,
    authority,
    level,
    category,
    beneficiary,
    overview,
    eligibility,
    benefits,
    documents,
    steps,
    official_url,
    deadline,
    status,
    last_verified,
    geography,
    disclaimer,
    created_at,
    updated_at
`

export const getSchemes = wrapAsync(async (req, res) => {
    const [schemes] = await pool.query(`
        SELECT
            ${schemeFields}
        FROM schemes
        ORDER BY id DESC
    `)

    return res.status(200).json({
        success: true,
        schemes,
    })
})

export const getSchemeBySlug = wrapAsync(async (req, res) => {
    const { slug } = req.params

    const [schemes] = await pool.query(
        `
            SELECT
                ${schemeFields}
            FROM schemes
            WHERE slug = ?
            LIMIT 1
        `,
        [slug]
    )

    if (schemes.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Scheme not found.",
        })
    }

    return res.status(200).json({
        success: true,
        scheme: schemes[0],
    })
})
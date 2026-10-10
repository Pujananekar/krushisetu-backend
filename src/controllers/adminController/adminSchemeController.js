
import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"


export const getSchemes = wrapAsync(async (req, res) => {
    const [schemes] = await pool.query(`
        SELECT 
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
        FROM schemes
        ORDER BY id DESC
    `)


    return res.status(200).json({
        success: true,
        schemes,
    })
})

export const getSchemeById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [schemes] = await pool.query(
        `
            SELECT
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
            FROM schemes
            WHERE id = ?
            LIMIT 1
        `,
        [id]
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

export const createScheme = wrapAsync(async (req, res) => {
    const {
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
    } = req.body

    if (
        !name ||
        !slug ||
        !authority ||
        !level ||
        !category ||
        !beneficiary ||
        !overview ||
        !eligibility ||
        !benefits ||
        !documents ||
        !steps ||
        !official_url ||
        !last_verified
    ) {
        return res.status(400).json({
            success: false,
            message: "All required scheme fields must be provided.",
        })
    }

    const [existingScheme] = await pool.query(
        `
            SELECT id
            FROM schemes
            WHERE slug = ?
            LIMIT 1
        `,
        [slug]
    )

    if (existingScheme.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A scheme with this slug already exists.",
        })
    }

    const [result] = await pool.query(
        `
            INSERT INTO schemes (
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
                disclaimer
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
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
            deadline || null,
            status || "ACTIVE",
            last_verified,
            geography || null,
            disclaimer || null,
        ]
    )

    const [scheme] = await pool.query(
        `
            SELECT
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
            FROM schemes
            WHERE id = ?
            LIMIT 1
        `,
        [result.insertId]
    )

    return res.status(201).json({
        success: true,
        message: "Scheme created successfully.",
        scheme: scheme[0],
    })
})

export const updateScheme = wrapAsync(async (req, res) => {
    const { id } = req.params

    const {
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
    } = req.body

    if (
        !name ||
        !slug ||
        !authority ||
        !level ||
        !category ||
        !beneficiary ||
        !overview ||
        !eligibility ||
        !benefits ||
        !documents ||
        !steps ||
        !official_url ||
        !last_verified
    ) {
        return res.status(400).json({
            success: false,
            message: "All required scheme fields must be provided.",
        })
    }

    const [existingScheme] = await pool.query(
        `
            SELECT id
            FROM schemes
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingScheme.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Scheme not found.",
        })
    }

    const [duplicateSlug] = await pool.query(
        `
            SELECT id
            FROM schemes
            WHERE slug = ?
            AND id != ?
            LIMIT 1
        `,
        [slug, id]
    )

    if (duplicateSlug.length > 0) {
        return res.status(409).json({
            success: false,
            message: "Another scheme already uses this slug.",
        })
    }

    await pool.query(
        `
            UPDATE schemes
            SET
                name = ?,
                slug = ?,
                authority = ?,
                level = ?,
                category = ?,
                beneficiary = ?,
                overview = ?,
                eligibility = ?,
                benefits = ?,
                documents = ?,
                steps = ?,
                official_url = ?,
                deadline = ?,
                status = ?,
                last_verified = ?,
                geography = ?,
                disclaimer = ?
            WHERE id = ?
        `,
        [
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
            deadline || null,
            status || "ACTIVE",
            last_verified,
            geography || null,
            disclaimer || null,
            id,
        ]
    )

    const [scheme] = await pool.query(
        `
            SELECT
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
            FROM schemes
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Scheme updated successfully.",
        scheme: scheme[0],
    })
})

export const deleteScheme = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [existingScheme] = await pool.query(
        `
            SELECT id
            FROM schemes
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    )

    if (existingScheme.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Scheme not found.",
        })
    }

    await pool.query(
        `
            DELETE FROM schemes
            WHERE id = ?
        `,
        [id]
    )

    return res.status(200).json({
        success: true,
        message: "Scheme deleted successfully.",
    })
})
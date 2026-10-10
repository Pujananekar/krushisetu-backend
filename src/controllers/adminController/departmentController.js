import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

/* =========================================================
   GET ALL DEPARTMENTS
========================================================= */
export const getDepartments = wrapAsync(async (req, res) => {
    const [departments] = await pool.query(`
        SELECT
            id,
            title,
            slug,
            description,
            icon,
            cta,
            created_at,
            updated_at
        FROM departments
        ORDER BY id ASC
    `)

    return res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
    })
})

/* =========================================================
   GET DEPARTMENT BY ID
========================================================= */
export const getDepartmentById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [departments] = await pool.query(
        `
        SELECT
            id,
            title,
            slug,
            description,
            icon,
            cta,
            created_at,
            updated_at
        FROM departments
        WHERE id = ?
        LIMIT 1
        `,
        [id],
    )

    if (departments.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Department not found.",
        })
    }

    const department = departments[0]

    const [
        [beneficiaries],
        [services],
        [process],
    ] = await Promise.all([
        pool.query(
            `
            SELECT
                id,
                beneficiary
            FROM department_beneficiaries
            WHERE dept_id = ?
            ORDER BY id ASC
            `,
            [id],
        ),

        pool.query(
            `
            SELECT
                id,
                service
            FROM department_services
            WHERE dept_id = ?
            ORDER BY id ASC
            `,
            [id],
        ),

        pool.query(
            `
            SELECT
                id,
                step
            FROM department_process
            WHERE dept_id = ?
            ORDER BY id ASC
            `,
            [id],
        ),
    ])

    return res.status(200).json({
        success: true,
        data: {
            ...department,
            beneficiaries,
            services,
            process,
        },
    })
})

/* =========================================================
   UPDATE DEPARTMENT DESCRIPTION
========================================================= */
export const updateDepartmentDescription = wrapAsync(
    async (req, res) => {
        const { id } = req.params
        const { description } = req.body

        if (
            description === undefined ||
            description === null ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Description is required.",
            })
        }

        const [result] = await pool.query(
            `
            UPDATE departments
            SET description = ?
            WHERE id = ?
            `,
            [
                description.trim(),
                id,
            ],
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found.",
            })
        }

        const [departments] = await pool.query(
            `
            SELECT
                id,
                title,
                slug,
                description,
                icon,
                cta,
                created_at,
                updated_at
            FROM departments
            WHERE id = ?
            LIMIT 1
            `,
            [id],
        )

        return res.status(200).json({
            success: true,
            message: "Department description updated successfully.",
            data: departments[0],
        })
    },
)

/* =========================================================
   BENEFICIARIES
========================================================= */
export const addBeneficiary = wrapAsync(async (req, res) => {
    const { id } = req.params
    const { beneficiary } = req.body

    if (
        beneficiary === undefined ||
        beneficiary === null ||
        !beneficiary.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Beneficiary is required.",
        })
    }

    const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ? LIMIT 1",
        [id],
    )

    if (departments.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Department not found.",
        })
    }

    const [result] = await pool.query(
        `
        INSERT INTO department_beneficiaries
            (dept_id, beneficiary)
        VALUES
            (?, ?)
        `,
        [
            id,
            beneficiary.trim(),
        ],
    )

    const [rows] = await pool.query(
        `
        SELECT
            id,
            beneficiary
        FROM department_beneficiaries
        WHERE id = ?
        `,
        [result.insertId],
    )

    return res.status(201).json({
        success: true,
        message: "Beneficiary added successfully.",
        data: rows[0],
    })
})

export const updateBeneficiary = wrapAsync(async (req, res) => {
    const { id, beneficiaryId } = req.params
    const { beneficiary } = req.body

    if (
        beneficiary === undefined ||
        beneficiary === null ||
        !beneficiary.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Beneficiary is required.",
        })
    }

    const [result] = await pool.query(
        `
        UPDATE department_beneficiaries
        SET beneficiary = ?
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            beneficiary.trim(),
            beneficiaryId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Beneficiary not found.",
        })
    }

    const [rows] = await pool.query(
        `
        SELECT
            id,
            beneficiary
        FROM department_beneficiaries
        WHERE id = ?
        `,
        [beneficiaryId],
    )

    return res.status(200).json({
        success: true,
        message: "Beneficiary updated successfully.",
        data: rows[0],
    })
})

export const deleteBeneficiary = wrapAsync(async (req, res) => {
    const { id, beneficiaryId } = req.params

    const [result] = await pool.query(
        `
        DELETE FROM department_beneficiaries
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            beneficiaryId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Beneficiary not found.",
        })
    }

    return res.status(200).json({
        success: true,
        message: "Beneficiary deleted successfully.",
    })
})

/* =========================================================
   SERVICES
========================================================= */
export const addService = wrapAsync(async (req, res) => {
    const { id } = req.params
    const { service } = req.body

    if (
        service === undefined ||
        service === null ||
        !service.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Service is required.",
        })
    }

    const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ? LIMIT 1",
        [id],
    )

    if (departments.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Department not found.",
        })
    }

    const [result] = await pool.query(
        `
        INSERT INTO department_services
            (dept_id, service)
        VALUES
            (?, ?)
        `,
        [
            id,
            service.trim(),
        ],
    )

    const [rows] = await pool.query(
        `
        SELECT
            id,
            service
        FROM department_services
        WHERE id = ?
        `,
        [result.insertId],
    )

    return res.status(201).json({
        success: true,
        message: "Service added successfully.",
        data: rows[0],
    })
})

export const updateService = wrapAsync(async (req, res) => {
    const { id, serviceId } = req.params
    const { service } = req.body

    if (
        service === undefined ||
        service === null ||
        !service.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Service is required.",
        })
    }

    const [result] = await pool.query(
        `
        UPDATE department_services
        SET service = ?
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            service.trim(),
            serviceId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Service not found.",
        })
    }

    const [rows] = await pool.query(
        `
        SELECT
            id,
            service
        FROM department_services
        WHERE id = ?
        `,
        [serviceId],
    )

    return res.status(200).json({
        success: true,
        message: "Service updated successfully.",
        data: rows[0],
    })
})

export const deleteService = wrapAsync(async (req, res) => {
    const { id, serviceId } = req.params

    const [result] = await pool.query(
        `
        DELETE FROM department_services
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            serviceId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Service not found.",
        })
    }

    return res.status(200).json({
        success: true,
        message: "Service deleted successfully.",
    })
})

/* =========================================================
   PROCESS
========================================================= */
export const addProcessStep = wrapAsync(async (req, res) => {
    const { id } = req.params
    const { step } = req.body

    if (
        step === undefined ||
        step === null ||
        !step.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Process step is required.",
        })
    }

    const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ? LIMIT 1",
        [id],
    )

    if (departments.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Department not found.",
        })
    }

    const [result] = await pool.query(
        `
        INSERT INTO department_process
            (dept_id, step)
        VALUES
            (?, ?)
        `,
        [
            id,
            step.trim(),
        ],
    )

    const [rows] = await pool.query(
        `
        SELECT
            id,
            step
        FROM department_process
        WHERE id = ?
        `,
        [result.insertId],
    )

    return res.status(201).json({
        success: true,
        message: "Process step added successfully.",
        data: rows[0],
    })
})

export const updateProcessStep = wrapAsync(async (req, res) => {
    const { id, processId } = req.params
    const { step } = req.body

    if (
        step === undefined ||
        step === null ||
        !step.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Process step is required.",
        })
    }

    const [result] = await pool.query(
        `
        UPDATE department_process
        SET step = ?
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            step.trim(),
            processId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Process step not found.",
        })
    }

    const [rows] = await pool.query(
        `
        SELECT
            id,
            step
        FROM department_process
        WHERE id = ?
        `,
        [processId],
    )

    return res.status(200).json({
        success: true,
        message: "Process step updated successfully.",
        data: rows[0],
    })
})

export const deleteProcessStep = wrapAsync(async (req, res) => {
    const { id, processId } = req.params

    const [result] = await pool.query(
        `
        DELETE FROM department_process
        WHERE id = ?
        AND dept_id = ?
        `,
        [
            processId,
            id,
        ],
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "Process step not found.",
        })
    }

    return res.status(200).json({
        success: true,
        message: "Process step deleted successfully.",
    })
})
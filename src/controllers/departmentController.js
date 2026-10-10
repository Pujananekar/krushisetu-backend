import pool from "../config/db.js";
import wrapAsync from "../utils/tryCatchWrapper.js";

export const getDepartments = wrapAsync(async (req, res) => {
    const [departments] = await pool.query(
        `SELECT id, title, slug, description, icon, cta, cta_path
         FROM departments
         ORDER BY id ASC`
    );

    res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
    });
});

export const getDepartmentBySlug = wrapAsync(async (req, res) => {
    const { slug } = req.params;

    const [departments] = await pool.query(
        `SELECT id, title, slug, description, icon, cta, cta_path
         FROM departments
         WHERE slug = ?`,
        [slug]
    );

    if (departments.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Department not found",
        });
    }

    const department = departments[0];

    const [beneficiaries] = await pool.query(
        `SELECT id, beneficiary
         FROM department_beneficiaries
         WHERE dept_id = ?
         ORDER BY id ASC`,
        [department.id]
    );

    const [services] = await pool.query(
        `SELECT id, service
         FROM department_services
         WHERE dept_id = ?
         ORDER BY id ASC`,
        [department.id]
    );

    const [process] = await pool.query(
        `SELECT id, step
         FROM department_process
         WHERE dept_id = ?
         ORDER BY id ASC`,
        [department.id]
    );

    return res.status(200).json({
        success: true,
        data: {
            ...department,

            beneficiaries: beneficiaries.map(
                (item) => item.beneficiary
            ),

            services: services.map(
                (item) => item.service
            ),

            process: process.map(
                (item) => item.step
            ),
        },
    });
});
import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"
import createAuditLog from "../../utils/createAuditLog.js"


const ACTIONS = [
    "CREATE",
    "UPDATE",
    "EDIT",
    "DELETE",
    "PUBLISH",
    "UNPUBLISH",
    "EXPORT",
    "LOGIN",
    "LOGOUT",
    "STATUS_CHANGE",
    "PERMISSION_CHANGE",
]


const getSeverityExpression = () => {
    return `
        CASE
            WHEN UPPER(al.action) IN (
                'DELETE',
                'PERMISSION_CHANGE'
            )
                THEN 'HIGH'

            WHEN UPPER(al.action) IN (
                'EXPORT',
                'STATUS_CHANGE',
                'PUBLISH',
                'UNPUBLISH'
            )
                THEN 'MEDIUM'

            ELSE 'NORMAL'
        END
    `
}


/*
=========================================================
GET AUDIT LOGS
=========================================================
*/

export const getAuditLogs = wrapAsync(
    async (req, res) => {
        const {
            page = 1,
            limit = 10,
            search = "",
            action = "ALL",
            module = "ALL",
            adminId = "ALL",
            severity = "ALL",
            date = "ALL",
            startDate = "",
            endDate = "",
        } = req.query


        const parsedPage = Math.max(
            Number.parseInt(page, 10) || 1,
            1
        )

        const parsedLimit = Math.min(
            Math.max(
                Number.parseInt(limit, 10) || 10,
                1
            ),
            100
        )

        const offset =
            (parsedPage - 1) *
            parsedLimit


        const conditions = []
        const values = []


        /*
        -------------------------------------------------
        SEARCH
        -------------------------------------------------
        */

        if (search.trim()) {
            const searchValue =
                `%${search.trim()}%`

            conditions.push(`
                (
                    al.description LIKE ?
                    OR al.record_label LIKE ?
                    OR al.record_id LIKE ?
                    OR al.module LIKE ?
                    OR al.action LIKE ?
                    OR au.name LIKE ?
                    OR au.email LIKE ?
                )
            `)

            values.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            )
        }


        /*
        -------------------------------------------------
        ACTION
        -------------------------------------------------
        */

        if (
            action !== "ALL" &&
            ACTIONS.includes(
                action.toUpperCase()
            )
        ) {
            conditions.push(`
                UPPER(al.action) = ?
            `)

            values.push(
                action.toUpperCase()
            )
        }


        /*
        -------------------------------------------------
        MODULE
        -------------------------------------------------
        */

        if (
            module &&
            module !== "ALL"
        ) {
            conditions.push(`
                al.module = ?
            `)

            values.push(module)
        }


        /*
        -------------------------------------------------
        ACTOR
        -------------------------------------------------
        */

        if (
            adminId &&
            adminId !== "ALL"
        ) {
            const parsedAdminId =
                Number.parseInt(
                    adminId,
                    10
                )

            if (
                Number.isInteger(
                    parsedAdminId
                )
            ) {
                conditions.push(`
                    al.admin_id = ?
                `)

                values.push(
                    parsedAdminId
                )
            }
        }


        /*
        -------------------------------------------------
        SEVERITY
        -------------------------------------------------
        */

        if (
            severity &&
            severity !== "ALL"
        ) {
            const severityValue =
                severity.toUpperCase()

            if (
                ["NORMAL", "MEDIUM", "HIGH"]
                    .includes(
                        severityValue
                    )
            ) {
                conditions.push(`
                    ${getSeverityExpression()} = ?
                `)

                values.push(
                    severityValue
                )
            }
        }


        /*
        -------------------------------------------------
        DATE FILTER
        -------------------------------------------------
        */

        if (date === "TODAY") {
            conditions.push(`
                DATE(al.created_at) = CURDATE()
            `)
        }

        if (date === "YESTERDAY") {
            conditions.push(`
                DATE(al.created_at) =
                CURDATE() - INTERVAL 1 DAY
            `)
        }

        if (date === "LAST_7_DAYS") {
            conditions.push(`
                al.created_at >=
                NOW() - INTERVAL 7 DAY
            `)
        }

        if (date === "LAST_30_DAYS") {
            conditions.push(`
                al.created_at >=
                NOW() - INTERVAL 30 DAY
            `)
        }

        if (
            date === "CUSTOM" &&
            startDate
        ) {
            conditions.push(`
                al.created_at >= ?
            `)

            values.push(
                `${startDate} 00:00:00`
            )
        }

        if (
            date === "CUSTOM" &&
            endDate
        ) {
            conditions.push(`
                al.created_at <= ?
            `)

            values.push(
                `${endDate} 23:59:59`
            )
        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(
                      " AND "
                  )}`
                : ""


        /*
        -------------------------------------------------
        COUNT
        -------------------------------------------------
        */

        const [countResult] =
            await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM audit_logs al
                LEFT JOIN admin_users au
                    ON au.id = al.admin_id
                ${whereClause}
                `,
                values
            )


        const total =
            Number(
                countResult[0]?.total || 0
            )

        const totalPages = Math.max(
            Math.ceil(
                total / parsedLimit
            ),
            1
        )


        /*
        -------------------------------------------------
        AUDIT RECORDS
        -------------------------------------------------
        */

        const [logs] =
            await pool.query(
                `
                SELECT
                    al.id,
                    al.admin_id,
                    COALESCE(
                        au.name,
                        'System'
                    ) AS admin_name,
                    au.email AS admin_email,

                    al.action,
                    al.module,
                    al.record_id,
                    al.record_label,
                    al.description,

                    al.old_values,
                    al.new_values,

                    al.ip_address,
                    al.user_agent,
                    al.created_at,

                    ${getSeverityExpression()}
                        AS severity

                FROM audit_logs al

                LEFT JOIN admin_users au
                    ON au.id = al.admin_id

                ${whereClause}

                ORDER BY
                    al.created_at DESC,
                    al.id DESC

                LIMIT ?
                OFFSET ?
                `,
                [
                    ...values,
                    parsedLimit,
                    offset,
                ]
            )


        /*
        -------------------------------------------------
        NORMALIZE JSON
        -------------------------------------------------
        */

        const formattedLogs =
            logs.map((log) => ({
                ...log,

                old_values:
                    parseJsonValue(
                        log.old_values
                    ),

                new_values:
                    parseJsonValue(
                        log.new_values
                    ),

                severity:
                    log.severity,
            }))


        return res.status(200).json({
            success: true,

            data: formattedLogs,

            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages,
                hasNextPage:
                    parsedPage <
                    totalPages,
                hasPreviousPage:
                    parsedPage > 1,
            },
        })
    }
)


/*
=========================================================
GET SINGLE AUDIT LOG
=========================================================
*/

export const getAuditLogById =
    wrapAsync(
        async (req, res) => {
            const { id } =
                req.params

            const [logs] =
                await pool.query(
                    `
                    SELECT
                        al.id,
                        al.admin_id,

                        COALESCE(
                            au.name,
                            'System'
                        ) AS admin_name,

                        au.email AS admin_email,

                        al.action,
                        al.module,
                        al.record_id,
                        al.record_label,
                        al.description,

                        al.old_values,
                        al.new_values,

                        al.ip_address,
                        al.user_agent,
                        al.created_at,

                        ${getSeverityExpression()}
                            AS severity

                    FROM audit_logs al

                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id

                    WHERE al.id = ?

                    LIMIT 1
                    `,
                    [id]
                )


            if (
                logs.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Audit log not found.",
                })
            }


            const log = logs[0]


            return res.status(200).json({
                success: true,

                data: {
                    ...log,

                    old_values:
                        parseJsonValue(
                            log.old_values
                        ),

                    new_values:
                        parseJsonValue(
                            log.new_values
                        ),
                },
            })
        }
    )


/*
=========================================================
GET AUDIT STATISTICS
=========================================================
*/

export const getAuditLogStats =
    wrapAsync(
        async (req, res) => {
            const {
                search = "",
                action = "ALL",
                module = "ALL",
                adminId = "ALL",
                severity = "ALL",
                date = "ALL",
                startDate = "",
                endDate = "",
            } = req.query


            const conditions = []
            const values = []


            /*
            -------------------------------------------------
            SAME FILTERS AS LOG LIST
            -------------------------------------------------
            */

            if (search.trim()) {
                const searchValue =
                    `%${search.trim()}%`

                conditions.push(`
                    (
                        al.description LIKE ?
                        OR al.record_label LIKE ?
                        OR al.record_id LIKE ?
                        OR al.module LIKE ?
                        OR al.action LIKE ?
                        OR au.name LIKE ?
                        OR au.email LIKE ?
                    )
                `)

                values.push(
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue
                )
            }


            if (
                action !== "ALL" &&
                ACTIONS.includes(
                    action.toUpperCase()
                )
            ) {
                conditions.push(`
                    UPPER(al.action) = ?
                `)

                values.push(
                    action.toUpperCase()
                )
            }


            if (
                module &&
                module !== "ALL"
            ) {
                conditions.push(`
                    al.module = ?
                `)

                values.push(module)
            }


            if (
                adminId &&
                adminId !== "ALL"
            ) {
                const parsedAdminId =
                    Number.parseInt(
                        adminId,
                        10
                    )

                if (
                    Number.isInteger(
                        parsedAdminId
                    )
                ) {
                    conditions.push(`
                        al.admin_id = ?
                    `)

                    values.push(
                        parsedAdminId
                    )
                }
            }


            if (
                severity &&
                severity !== "ALL"
            ) {
                const severityValue =
                    severity.toUpperCase()

                if (
                    [
                        "NORMAL",
                        "MEDIUM",
                        "HIGH",
                    ].includes(
                        severityValue
                    )
                ) {
                    conditions.push(`
                        ${getSeverityExpression()} = ?
                    `)

                    values.push(
                        severityValue
                    )
                }
            }


            if (date === "TODAY") {
                conditions.push(`
                    DATE(al.created_at) =
                    CURDATE()
                `)
            }

            if (date === "YESTERDAY") {
                conditions.push(`
                    DATE(al.created_at) =
                    CURDATE() - INTERVAL 1 DAY
                `)
            }

            if (date === "LAST_7_DAYS") {
                conditions.push(`
                    al.created_at >=
                    NOW() - INTERVAL 7 DAY
                `)
            }

            if (date === "LAST_30_DAYS") {
                conditions.push(`
                    al.created_at >=
                    NOW() - INTERVAL 30 DAY
                `)
            }

            if (
                date === "CUSTOM" &&
                startDate
            ) {
                conditions.push(`
                    al.created_at >= ?
                `)

                values.push(
                    `${startDate} 00:00:00`
                )
            }

            if (
                date === "CUSTOM" &&
                endDate
            ) {
                conditions.push(`
                    al.created_at <= ?
                `)

                values.push(
                    `${endDate} 23:59:59`
                )
            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(
                          " AND "
                      )}`
                    : ""


            const [
                [totalResult],
                [updateResult],
                [createResult],
                [exportResult],
                [highRiskResult],
            ] = await Promise.all([
                pool.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    `,
                    values
                ),

                pool.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    ${
                        whereClause
                            ? "AND"
                            : "WHERE"
                    }
                    UPPER(al.action)
                    IN ('UPDATE', 'EDIT')
                    `,
                    values
                ),

                pool.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    ${
                        whereClause
                            ? "AND"
                            : "WHERE"
                    }
                    UPPER(al.action)
                    = 'CREATE'
                    `,
                    values
                ),

                pool.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    ${
                        whereClause
                            ? "AND"
                            : "WHERE"
                    }
                    UPPER(al.action)
                    = 'EXPORT'
                    `,
                    values
                ),

                pool.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    ${
                        whereClause
                            ? "AND"
                            : "WHERE"
                    }
                    ${getSeverityExpression()}
                    = 'HIGH'
                    `,
                    values
                ),
            ])


            /*
            -------------------------------------------------
            MODULES
            -------------------------------------------------
            */

            const [modules] =
                await pool.query(
                    `
                    SELECT
                        al.module,
                        COUNT(*) AS count
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    GROUP BY al.module
                    ORDER BY al.module ASC
                    `,
                    values
                )


            /*
            -------------------------------------------------
            ACTORS
            -------------------------------------------------
            */

            const [actors] =
                await pool.query(
                    `
                    SELECT
                        al.admin_id,
                        COALESCE(
                            au.name,
                            'System'
                        ) AS name,
                        au.email,
                        COUNT(*) AS count
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    GROUP BY
                        al.admin_id,
                        au.name,
                        au.email
                    ORDER BY name ASC
                    `,
                    values
                )


            return res.status(200).json({
                success: true,

                data: {
                    total:
                        Number(
                            totalResult[0]
                                ?.total || 0
                        ),

                    updates:
                        Number(
                            updateResult[0]
                                ?.total || 0
                        ),

                    created:
                        Number(
                            createResult[0]
                                ?.total || 0
                        ),

                    exports:
                        Number(
                            exportResult[0]
                                ?.total || 0
                        ),

                    highRisk:
                        Number(
                            highRiskResult[0]
                                ?.total || 0
                        ),

                    modules:
                        modules.map(
                            (item) => ({
                                module:
                                    item.module,
                                count:
                                    Number(
                                        item.count
                                    ),
                            })
                        ),

                    actors:
                        actors.map(
                            (item) => ({
                                adminId:
                                    item.admin_id,
                                name:
                                    item.name,
                                email:
                                    item.email,
                                count:
                                    Number(
                                        item.count
                                    ),
                            })
                        ),
                },
            })
        }
    )


/*
=========================================================
EXPORT AUDIT LOGS
=========================================================
*/

export const exportAuditLogs =
    wrapAsync(
        async (req, res) => {
            const {
                search = "",
                action = "ALL",
                module = "ALL",
                adminId = "ALL",
                severity = "ALL",
                date = "ALL",
                startDate = "",
                endDate = "",
            } = req.query


            const conditions = []
            const values = []


            if (search.trim()) {
                const searchValue =
                    `%${search.trim()}%`

                conditions.push(`
                    (
                        al.description LIKE ?
                        OR al.record_label LIKE ?
                        OR al.record_id LIKE ?
                        OR al.module LIKE ?
                        OR al.action LIKE ?
                        OR au.name LIKE ?
                        OR au.email LIKE ?
                    )
                `)

                values.push(
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue
                )
            }


            if (
                action !== "ALL" &&
                ACTIONS.includes(
                    action.toUpperCase()
                )
            ) {
                conditions.push(`
                    UPPER(al.action) = ?
                `)

                values.push(
                    action.toUpperCase()
                )
            }


            if (
                module &&
                module !== "ALL"
            ) {
                conditions.push(`
                    al.module = ?
                `)

                values.push(module)
            }


            if (
                adminId &&
                adminId !== "ALL"
            ) {
                const parsedAdminId =
                    Number.parseInt(
                        adminId,
                        10
                    )

                if (
                    Number.isInteger(
                        parsedAdminId
                    )
                ) {
                    conditions.push(`
                        al.admin_id = ?
                    `)

                    values.push(
                        parsedAdminId
                    )
                }
            }


            if (
                severity &&
                severity !== "ALL"
            ) {
                const severityValue =
                    severity.toUpperCase()

                if (
                    [
                        "NORMAL",
                        "MEDIUM",
                        "HIGH",
                    ].includes(
                        severityValue
                    )
                ) {
                    conditions.push(`
                        ${getSeverityExpression()} = ?
                    `)

                    values.push(
                        severityValue
                    )
                }
            }


            if (date === "TODAY") {
                conditions.push(`
                    DATE(al.created_at) =
                    CURDATE()
                `)
            }

            if (date === "YESTERDAY") {
                conditions.push(`
                    DATE(al.created_at) =
                    CURDATE() - INTERVAL 1 DAY
                `)
            }

            if (date === "LAST_7_DAYS") {
                conditions.push(`
                    al.created_at >=
                    NOW() - INTERVAL 7 DAY
                `)
            }

            if (date === "LAST_30_DAYS") {
                conditions.push(`
                    al.created_at >=
                    NOW() - INTERVAL 30 DAY
                `)
            }

            if (
                date === "CUSTOM" &&
                startDate
            ) {
                conditions.push(`
                    al.created_at >= ?
                `)

                values.push(
                    `${startDate} 00:00:00`
                )
            }

            if (
                date === "CUSTOM" &&
                endDate
            ) {
                conditions.push(`
                    al.created_at <= ?
                `)

                values.push(
                    `${endDate} 23:59:59`
                )
            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(
                          " AND "
                      )}`
                    : ""


            const [logs] =
                await pool.query(
                    `
                    SELECT
                        al.id,
                        COALESCE(
                            au.name,
                            'System'
                        ) AS admin_name,
                        COALESCE(
                            au.email,
                            ''
                        ) AS admin_email,
                        al.action,
                        al.module,
                        al.record_id,
                        al.record_label,
                        al.description,
                        al.ip_address,
                        al.created_at,
                        ${getSeverityExpression()}
                            AS severity
                    FROM audit_logs al
                    LEFT JOIN admin_users au
                        ON au.id = al.admin_id
                    ${whereClause}
                    ORDER BY
                        al.created_at DESC,
                        al.id DESC
                    `,
                    values
                )


            const escapeCsv = (value) => {
                if (
                    value === null ||
                    value === undefined
                ) {
                    return ""
                }

                const stringValue =
                    String(value)

                return `"${stringValue.replace(
                    /"/g,
                    '""'
                )}"`
            }


            const header = [
                "ID",
                "Actor",
                "Actor Email",
                "Action",
                "Module",
                "Record ID",
                "Record",
                "Description",
                "Severity",
                "IP Address",
                "Date & Time",
            ]


            const rows = logs.map(
                (log) => [
                    log.id,
                    log.admin_name,
                    log.admin_email,
                    log.action,
                    log.module,
                    log.record_id,
                    log.record_label,
                    log.description,
                    log.severity,
                    log.ip_address,
                    log.created_at,
                ]
                    .map(escapeCsv)
                    .join(",")
            )


            const csv = [
                header
                    .map(escapeCsv)
                    .join(","),
                ...rows,
            ].join("\r\n")


            /*
            -------------------------------------------------
            LOG THE EXPORT ITSELF
            -------------------------------------------------
            */

            await createAuditLog({
                req,

                action: "EXPORT",

                module: "Audit Logs",

                description:
                    "Audit logs exported.",

                newValues: {
                    filters: {
                        search,
                        action,
                        module,
                        adminId,
                        severity,
                        date,
                        startDate,
                        endDate,
                    },

                    recordCount:
                        logs.length,
                },
            })


            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            )

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="krushisetu-audit-logs-${getFileDate()}.csv"`
            )


            return res.status(200).send(
                csv
            )
        }
    )


/*
=========================================================
HELPERS
=========================================================
*/

const parseJsonValue = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null
    }

    if (
        typeof value === "object"
    ) {
        return value
    }

    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}


const getFileDate = () => {
    const date = new Date()

    const year =
        date.getFullYear()

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0")

    const day =
        String(
            date.getDate()
        ).padStart(2, "0")

    return `${year}-${month}-${day}`
}
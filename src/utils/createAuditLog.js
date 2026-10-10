import pool from "../config/db.js"

const createAuditLog = async ({
    req,
    action,
    module,
    recordId = null,
    recordLabel = null,
    description = null,
    oldValues = null,
    newValues = null,
}) => {
    try {
        const adminId =
            req.session?.admin?.id || null

        const ipAddress =
            req.headers["x-forwarded-for"]
                ?.split(",")[0]
                ?.trim() ||
            req.socket?.remoteAddress ||
            req.ip ||
            null

        const userAgent =
            req.headers["user-agent"] ||
            null

        await pool.query(
            `
            INSERT INTO audit_logs (
                admin_id,
                action,
                module,
                record_id,
                record_label,
                description,
                old_values,
                new_values,
                ip_address,
                user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                adminId,
                action,
                module,
                recordId,
                recordLabel,
                description,
                oldValues !== null
                    ? JSON.stringify(oldValues)
                    : null,
                newValues !== null
                    ? JSON.stringify(newValues)
                    : null,
                ipAddress,
                userAgent,
            ]
        )
    } catch (error) {
        /*
         * Audit logging must never break the
         * actual admin operation.
         */
        console.error(
            "Audit log error:",
            error.message
        )
    }
}

export default createAuditLog
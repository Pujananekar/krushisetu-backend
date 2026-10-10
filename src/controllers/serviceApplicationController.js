import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateServiceApplication from "../validators/serviceApplicationValidator.js"

export const createServiceApplication = wrapAsync(async (req, res) => {
    const validation = validateServiceApplication(req.body)

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Please correct the submitted data.",
            errors: validation.errors,
        })
    }

    const {
        name,
        mobile,
        crop,
        location,
        category,
        urgency,
        problem,
        consent,
    } = validation.data

    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const [applicationResult] = await connection.execute(
            `
                INSERT INTO applications
                (reference_number, application_type, status, consent)
                VALUES (?, ?, ?, ?)
            `,
            [null, "SERVICE", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "SRV"
        )

        await connection.execute(
            `
                UPDATE applications
                SET reference_number = ?
                WHERE id = ?
            `,
            [referenceNumber, applicationId]
        )

        await connection.execute(
            `
                INSERT INTO service_applications
                (
                    application_id,
                    name,
                    mobile,
                    crop,
                    location,
                    category,
                    urgency,
                    problem
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                name,
                mobile,
                crop,
                location,
                category,
                urgency || null,
                problem || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New Service Request - ${referenceNumber}`,
                text: `
                    New service request received.

                    Reference Number : ${referenceNumber}

                    Name : ${name}
                    Mobile / Email : ${mobile}
                    Crop / Activity : ${crop}
                    Location : ${location}
                    Support Category : ${category}
                    Urgency : ${urgency || "Not Provided"}

                    Problem / Requirement :
                    ${problem || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Service application email failed:",
                mailError.message
            )
        }


        return res.status(201).json({
            success: true,
            message: "Service request submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
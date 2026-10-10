import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validatePartnershipApplication from "../validators/partnershipApplicatonValidator.js"


export const createPartnershipApplication = wrapAsync(async (req, res) => {
    const validation = validatePartnershipApplication(req.body)

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Please correct the submitted data.",
            errors: validation.errors,
        })
    }

    const {
        organisation,
        contact,
        email,
        mobile,
        theme,
        geography,
        target,
        timeline,
        message,
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
            [null, "PARTNERSHIP", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "CSR"
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
                INSERT INTO partnership_applications
                (
                    application_id,
                    organisation,
                    contact,
                    email,
                    mobile,
                    theme,
                    geography,
                    target,
                    timeline,
                    message
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                organisation,
                contact,
                email,
                mobile,
                theme,
                geography,
                target,
                timeline || null,
                message || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: email,
                subject: `New CSR / Partnership Enquiry - ${referenceNumber}`,
                text: `
                    New CSR / partnership enquiry received.

                    Reference Number : ${referenceNumber}

                    Organisation : ${organisation}
                    Authorised Contact : ${contact}
                    Email : ${email}
                    Mobile : ${mobile}

                    Project Theme : ${theme}
                    Geography : ${geography}
                    Target Group : ${target}
                    Expected Timeline : ${timeline || "Not Provided"}

                    Message :
                    ${message || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Partnership application email failed:",
                mailError.message
            )
        }

        return res.status(201).json({
            success: true,
            message: "CSR / partnership enquiry submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
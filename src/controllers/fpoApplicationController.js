import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateFPOApplication from "../validators/fpoApplicationValidator.js"

export const createFPOApplication = wrapAsync(async (req, res) => {
    const validation = validateFPOApplication(req.body)

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
        district,
        members,
        commodity,
        status,
        support_required,
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
            [null, "FPO", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "FPO"
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
                INSERT INTO fpo_applications
                (
                    application_id,
                    organisation,
                    contact,
                    district,
                    members,
                    commodity,
                    status,
                    support_required
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                organisation,
                contact,
                district,
                members,
                commodity || null,
                status || null,
                support_required || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New FPO / Institution Enquiry - ${referenceNumber}`,
                text: `
                    New FPO / institution enquiry received.

                    Reference Number : ${referenceNumber}

                    Organisation / Group : ${organisation}
                    Contact Person : ${contact}
                    District : ${district}
                    Member Count : ${members ?? "Not Provided"}
                    Commodity : ${commodity || "Not Provided"}
                    Current Status : ${status || "Not Provided"}

                    Support Required :
                    ${support_required || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "FPO application email failed:",
                mailError.message
            )
        }


        return res.status(201).json({
            success: true,
            message: "FPO enquiry submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateTrainingApplication from "../validators/trainingApplicationValidator.js"

export const createTrainingApplication = wrapAsync(async (req, res) => {
    const validation = validateTrainingApplication(req.body)

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Please correct the submitted data.",
            errors: validation.errors,
        })
    }

    const {
        program,
        name,
        mobile,
        village,
        district,
        participant,
        organisation,
        accessibility_needs,
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
            [null, "TRAINING", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "TRN"
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
                INSERT INTO training_applications
                (
                    application_id,
                    program,
                    name,
                    mobile,
                    village,
                    district,
                    participant,
                    organisation,
                    accessibility_needs
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                program,
                name,
                mobile,
                village,
                district,
                participant,
                organisation || null,
                accessibility_needs || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New Training Application - ${referenceNumber}`,
                text: `
                    New training application received.

                    Reference Number : ${referenceNumber}

                    Training Programme : ${program}

                    Name : ${name}
                    Mobile / Email : ${mobile}
                    Village : ${village}
                    District : ${district}
                    Participant Type : ${participant}
                    Organisation : ${organisation || "Not Provided"}

                    Accessibility Needs :
                    ${accessibility_needs || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Training application email failed:",
                mailError.message
            )
        }


        return res.status(201).json({
            success: true,
            message: "Training application submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
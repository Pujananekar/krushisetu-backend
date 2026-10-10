import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateInternshipApplication from "../validators/internshipApplicationValidator.js"

export const createInternshipApplication = wrapAsync(async (req, res) => {
    const validation = validateInternshipApplication(req.body)

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Please correct the submitted data.",
            errors: validation.errors,
        })
    }

    const {
        name,
        college,
        course,
        location,
        duration,
        interest,
        additional_information,
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
            [null, "INTERNSHIP", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "INT"
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
                INSERT INTO internship_applications
                (
                    application_id,
                    name,
                    college,
                    course,
                    location,
                    duration,
                    interest,
                    additional_information
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                name,
                college,
                course,
                location,
                duration,
                interest,
                additional_information || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New Internship Application - ${referenceNumber}`,
                text: `
                    New internship application received.

                    Reference Number : ${referenceNumber}

                    Name : ${name}
                    College : ${college}
                    Course / Year : ${course}
                    Location : ${location}
                    Duration : ${duration}
                    Area of Interest : ${interest}

                    Additional Information :
                    ${additional_information || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Internship application email failed:",
                mailError.message
            )
        }



        return res.status(201).json({
            success: true,
            message: "Internship application submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
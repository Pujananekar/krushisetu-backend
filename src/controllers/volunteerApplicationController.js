import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateVolunteerApplication from "../validators/volunteerApplicationValidator.js"

export const createVolunteerApplication = wrapAsync(async (req, res) => {
    const validation = validateVolunteerApplication(req.body)

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
        location,
        expertise,
        experience,
        availability,
        contribution,
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
            [null, "VOLUNTEER", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "VOL"
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
                INSERT INTO volunteer_applications
                (
                    application_id,
                    name,
                    mobile,
                    location,
                    expertise,
                    experience,
                    availability,
                    contribution
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                name,
                mobile,
                location,
                expertise,
                experience || null,
                availability || null,
                contribution || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New Volunteer / Expert Interest - ${referenceNumber}`,
                text: `
                    New volunteer / expert interest received.

                    Reference Number : ${referenceNumber}

                    Name : ${name}
                    Mobile / Email : ${mobile}
                    Location : ${location}
                    Expertise : ${expertise}
                    Experience : ${experience || "Not Provided"}
                    Availability : ${availability || "Not Provided"}

                    How They Would Like to Contribute :
                    ${contribution || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Volunteer application email failed:",
                mailError.message
            )
        }


        return res.status(201).json({
            success: true,
            message: "Volunteer application submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
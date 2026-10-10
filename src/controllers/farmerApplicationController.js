import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"
import validateFarmerApplication from "../validators/farmerApplicationValidator.js"

export const createFarmerApplication = wrapAsync(async (req, res) => {
    const validation = validateFarmerApplication(req.body)

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
        village,
        taluka,
        district,
        pin,
        support_interests,
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
            [null, "FARMER", "NEW", consent]
        )

        const applicationId = applicationResult.insertId

        const referenceNumber = generateReferenceNumber(
            applicationId,
            "FRM"
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
                INSERT INTO farmer_applications
                (
                    application_id,
                    name,
                    mobile,
                    village,
                    taluka,
                    district,
                    pin,
                    support_interests
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                applicationId,
                name,
                mobile,
                village,
                taluka,
                district,
                pin,
                support_interests || null,
            ]
        )

        await connection.commit()

        try {
            await transporter.sendMail({
                from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
                to: process.env.CONTACT_RECEIVER_EMAIL,
                replyTo: process.env.MAIL_USER,
                subject: `New Farmer Application - ${referenceNumber}`,
                text: `
                    New farmer application received.

                    Reference Number : ${referenceNumber}

                    Name : ${name}
                    Mobile : ${mobile}
                    Village : ${village}
                    Taluka : ${taluka}
                    District : ${district}
                    PIN : ${pin}

                    Support Interests :
                    ${support_interests || "Not Provided"}
                `,
            })
        } catch (mailError) {
            console.error(
                "Farmer application email failed:",
                mailError.message
            )
        }

        
        return res.status(201).json({
            success: true,
            message: "Farmer application submitted successfully.",
            referenceNumber,
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})
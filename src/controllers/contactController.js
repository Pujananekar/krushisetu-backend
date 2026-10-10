import pool from "../config/db.js"
import generateReferenceNumber from "../config/generateReferenceNumber.js"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js"


export const createContactSubmission = wrapAsync(async (req, res) => {
    const { name, phone, email, message } = req.body

    if (!name || !phone || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
        })
    }

    const [result] = await pool.query(
        `
        INSERT INTO contact_submissions
        (reference_number, name, phone, email, message)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            "TEMP",
            name.trim(),
            phone.trim(),
            email.trim(),
            message.trim(),
        ]
    )

    const referenceNumber = generateReferenceNumber(result.insertId,"CON");

    await pool.query(
        `
        UPDATE contact_submissions
        SET reference_number = ?
        WHERE id = ?
        `,
        [referenceNumber, result.insertId]
    )

    try {
        await transporter.sendMail({
            from: `"Krushisetu Website" <${process.env.MAIL_USER}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL,
            replyTo: process.env.MAIL_USER,
            subject: `New Contact Enquiry - ${referenceNumber}`,
            text: `
New contact enquiry received.

Reference Number: ${referenceNumber}

Name: ${name.trim()}
Phone: ${phone.trim()}
Email: ${email.trim()}

Message:
${message.trim()}
            `,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
                    <h2 style="color: #166534;">
                        New Contact Enquiry
                    </h2>

                    <p>
                        A new contact enquiry has been submitted
                        through the Krushisetu website.
                    </p>

                    <hr />

                    <p>
                        <strong>Reference Number:</strong>
                        ${referenceNumber}
                    </p>

                    <p>
                        <strong>Name:</strong>
                        ${name.trim()}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${phone.trim()}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${email.trim()}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <p>
                        ${message.trim()}
                    </p>
                </div>
            `,
        })
    } catch (mailError) {
        console.error("Email sending failed:", mailError.message)
    }

    res.status(201).json({
        success: true,
        message: "Your message has been submitted successfully.",
        referenceNumber,
    })
})
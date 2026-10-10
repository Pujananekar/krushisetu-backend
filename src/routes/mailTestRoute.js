import express from "express"
import transporter from "../config/mail.js"
import wrapAsync from "../utils/tryCatchWrapper.js";

const router = express.Router();

router.get("/test", wrapAsync(async (req, res) => {
    const info = await transporter.sendMail({
        from : `"Krushisetu Website" <${process.env.MAIL_USER}>`,
        to : process.env.CONTACT_RECEIVER_EMAIL,
        subject: "Krushisetu Mail Test",
        text :"This is a test mail from krushisetu backend!!!",
        html:`
            <h2>Krushisetu Mail Test</h2>
            <p>This is a test Mail from krushisetu backend.</p>
            <p>If you received this email, the mail configuration is working correctly.</p>    
        `,
    })

    res.status(200).json({
        success:true,
        message:"Test mail set successfully....!",
        messageId : info.messageId
    })
}))

export default router
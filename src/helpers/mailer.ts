// D:\PROJECTS\BACKEND\evolve\src\helpers\mailer.ts
import User from "../models/userModel";
import bcryptjs from 'bcryptjs';
import nodemailer from 'nodemailer';

// create transporter once (may be a dummy if no creds provided)
let transporter: nodemailer.Transporter | null = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    console.warn('Email credentials missing; emails will not be sent.');
}

export const sendEmail = async ({ emailType, userId, email }: any) => {
    try {
        // create a hashed token
        const hashedToken = await bcryptjs.hash(userId.toString(), 10);

        if (emailType === "VERIFY") {
            await User.findByIdAndUpdate(userId, { verifyToken: hashedToken, verifyTokenExpiry: Date.now() + 3600000 });
        } else if (emailType === "RESET") {
            await User.findByIdAndUpdate(userId, { forgotPasswordToken: hashedToken, forgotPasswordTokenExpiry: Date.now() + 3600000 });
        }

        // prepare email content
        let subject = '';
        let text = '';
        if (emailType === 'VERIFY') {
            subject = 'Please verify your email';
            text = `Click this link to verify your account:\n${process.env.APP_URL}/verifyemail?token=${encodeURIComponent(hashedToken)}`;
        } else if (emailType === 'RESET') {
            subject = 'Password reset request';
            text = `You requested a password reset. Click the link below to set a new password (valid for 1 hour):\n${process.env.APP_URL}/reset-password/${encodeURIComponent(hashedToken)}`;
        }
        // send email if we have transporter configured and address provided
        if (email && transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: email,
                    subject,
                    text,
                });
            } catch (mailErr: any) {
                console.warn('Failed to send email:', mailErr.message);
                // don't rethrow; we still want to return token to caller
            }
        } else if (email && !transporter) {
            console.log('Email not sent because SMTP credentials are not configured.');
        }

        // Return the hashed token or any other necessary data
        return { hashedToken };

    } catch (error) {
        throw new Error((error as any).message);
    }
};

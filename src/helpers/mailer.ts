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
        // ensure recipient exists when sending an OTP (don't send emails to non‑existent accounts)
        if (emailType === 'OTP') {
            const existing = await User.findOne({ email });
            if (!existing) {
                // we throw to let caller decide; previously forgot-password route suppressed this
                throw new Error('Email address not found');
            }
        }

        // rawToken is what the user will receive; hashedToken is stored in DB for later verification
        let rawToken = userId.toString();
        if (emailType === 'OTP') {
            // generate 6‑digit numeric OTP
            rawToken = Math.floor(100000 + Math.random() * 900000).toString();
        }
        const hashedToken = await bcryptjs.hash(rawToken, 10);

        // persist appropriate token on the user record
        if (emailType === 'VERIFY') {
            await User.findByIdAndUpdate(userId, {
                verifyToken: hashedToken,
                verifyTokenExpiry: Date.now() + 3600000,
            });
        } else if (emailType === 'RESET') {
            await User.findByIdAndUpdate(userId, {
                forgotPasswordToken: hashedToken,
                forgotPasswordTokenExpiry: Date.now() + 3600000,
            });
        } else if (emailType === 'OTP') {
            await User.findByIdAndUpdate(userId, {
                otpToken: hashedToken,
                otpExpiry: Date.now() + 300000,
            });
        }

        // compose message body (text + optional html)
        let subject = '';
        let text = '';
        let html = '';

        if (emailType === 'VERIFY') {
            subject = 'Evolve – please verify your email';
            text = `Click this link to verify your account:\n${process.env.APP_URL}/verifyemail?token=${encodeURIComponent(
                hashedToken
            )}`;
            html = `<p>Click <a href="${process.env.APP_URL}/verifyemail?token=${encodeURIComponent(
                hashedToken
            )}">here</a> to verify your account.</p>`;
        } else if (emailType === 'RESET') {
            subject = 'Evolve – password reset request';
            text = `You requested a password reset. Click the link below to set a new password (valid for 1 hour):\n${
                process.env.APP_URL
            }/reset-password/${encodeURIComponent(hashedToken)}`;
            html = `<p>You requested a password reset. Click the button below to set a new password. This link is valid for 1 hour.</p>
                    <p style="text-align:center;"><a href="${process.env.APP_URL}/reset-password/${encodeURIComponent(
                hashedToken
            )}" style="background:#24a587;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a></p>`;
        } else if (emailType === 'OTP') {
            subject = 'Evolve – your one‑time password';
            text = `Your one-time password is: ${rawToken}\nIt will expire in 5 minutes.`;
            html = `
                <div style="font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.4;">
                  <h2 style="color:#24a587;">One-Time Password</h2>
                  <p>Use the code below to verify your action. The code will expire in <strong>5 minutes</strong>.</p>
                  <p style="font-size:24px;font-weight:bold;letter-spacing:2px;text-align:center;">${rawToken}</p>
                  <p>If you did not request this code, you can safely ignore this email.</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                  <p style="font-size:12px;color:#777;">Thanks,<br/>The Evolve Team</p>
                </div>`;
            // log the raw OTP in development for debugging
            if (process.env.NODE_ENV !== 'production') {
                // console.log(`DEBUG OTP for user ${userId}: ${rawToken}`);
            }
        } else if (emailType === 'PASSWORD_CHANGED') {
            subject = 'Evolve – your password has been changed';
            text = `This is a confirmation that the password for your account (${email}) was successfully changed. If you did not perform this action, please contact support immediately.`;
            html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.4;">
                    <h2 style="color:#24a587;">Password Changed</h2>
                    <p>The password for your Evolve account (${email}) has been <strong>successfully updated</strong>.</p>
                    <p>If you did not make this change, please <a href="${process.env.APP_URL}/login" style="color:#24a587;">login immediately</a> and reset your password or contact support.</p>
                    <p style="font-size:12px;color:#777;">Thanks,<br/>The Evolve Team</p>
                  </div>`;
        }

        // send email if transporter is configured
        if (email && transporter) {
            try {
                const mailOptions: any = {
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: email,
                    subject,
                    text,
                };
                if (html) {
                    mailOptions.html = html;
                }
                await transporter.sendMail(mailOptions);
            } catch (mailErr: any) {
                console.warn('Failed to send email:', mailErr.message);
            }
        } else if (email && !transporter) {
            // console.log('Email not sent because SMTP credentials are not configured.');
        }

        return { hashedToken };
    } catch (error) {
        throw new Error((error as any).message);
    }
};

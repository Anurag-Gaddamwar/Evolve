import {connect} from "../../../../dbConfig/dbConfig";
import User from "../../../../models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "../../../../helpers/mailer";

connect();

export async function POST(request: NextRequest) {
    try {
        const { token, password, email } = await request.json();
        if (!token || !password) {
            return NextResponse.json({ error: "Token and password required" }, { status: 400 });
        }
        
        // try to find by link token first
        let user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpiry: { $gt: Date.now() }
        });

        // if not found by reset link token, try OTP match
        if (!user) {
            // log incoming OTP for debugging
            if (process.env.NODE_ENV !== 'production') {
                console.log('Attempting OTP match for token:', token, 'at', new Date().toISOString());
            }
            
            // If email provided, check that specific user's OTP
            if (email) {
                const userByEmail = await User.findOne({ email });
                if (userByEmail && userByEmail.otpToken && userByEmail.otpExpiry) {
                    if (userByEmail.otpExpiry <= Date.now()) {
                        // OTP is expired for this user
                        return NextResponse.json({ error: "Your OTP has expired. Please request a new one." }, { status: 400 });
                    }
                    // Check if OTP matches
                    const match = await bcryptjs.compare(String(token).trim(), userByEmail.otpToken);
                    if (match) {
                        user = userByEmail;
                    }
                }
            } else {
                // Fallback: check all users with unexpired OTP (legacy behavior)
                const candidates = await User.find({ otpExpiry: { $gt: Date.now() } });
                for (const candidate of candidates) {
                    if (candidate.otpToken) {
                        const match = await bcryptjs.compare(String(token).trim(), candidate.otpToken);
                        if (match) {
                            user = candidate;
                            break;
                        }
                    }
                }
            }
            
            if (!user && process.env.NODE_ENV !== 'production') {
                console.warn('OTP attempt failed');
            }
        }

        if (!user) {
            // log failed attempts to aid debugging in development
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Failed reset attempt, provided token:', token);
            }
            // Check if token was numeric OTP format
            if (/^\d{4,6}$/.test(token)) {
                // If we have email, we already checked expiry above - this is truly invalid
                return NextResponse.json({ error: "Invalid OTP. Please check the code and try again." }, { status: 400 });
            }
            return NextResponse.json({ error: "Your reset link has expired. Please request a new one." }, { status: 400 });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcryptjs.compare(password, user.password);
        if (isSamePassword) {
            return NextResponse.json({ error: "New password cannot be the same as your current password." }, { status: 400 });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(password, salt);
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;
        user.otpToken = undefined;
        user.otpExpiry = undefined;
        await user.save();
        // send notification email about the password change
        try {
            await sendEmail({ emailType: 'PASSWORD_CHANGED', userId: user._id, email: user.email });
        } catch (_e) {
            // log but don't fail the request
            console.warn('Failed to send password change notification');
        }
        return NextResponse.json({ message: "Password reset successful", success: true, email: user.email });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
    }
}

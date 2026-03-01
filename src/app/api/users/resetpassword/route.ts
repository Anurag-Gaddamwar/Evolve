import {connect} from "../../../../dbConfig/dbConfig";
import User from "../../../../models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "../../../../helpers/mailer";

connect();

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();
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
            // fetch all users who still have an unexpired OTP
            const candidates = await User.find({ otpExpiry: { $gt: Date.now() } });
            for (const candidate of candidates) {
                if (candidate.otpToken) {
                    const match = await bcryptjs.compare(String(token).trim(), candidate.otpToken);
                    if (match) {
                        user = candidate;
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('OTP matched for user', candidate._id.toString());
                        }
                        break;
                    }
                }
            }
            if (!user && process.env.NODE_ENV !== 'production') {
                console.warn('OTP attempt failed; candidates count:', candidates.length);
                candidates.forEach((c) => {
                    console.warn('candidate id', c._id.toString(), 'hash', c.otpToken);
                });
            }
        }

        if (!user) {
            // log failed attempts to aid debugging in development
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Failed reset attempt, provided token:', token);
            }
            return NextResponse.json({ error: "Invalid or expired token or OTP" }, { status: 400 });
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
        return NextResponse.json({ message: "Password reset successful", success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}

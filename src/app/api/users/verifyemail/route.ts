// D:\PROJECTS\BACKEND\evolve\src\app\api\users\verifyemail\route.ts

import {connect} from "../../../../dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "../../../../models/userModel";
import bcryptjs from "bcryptjs";

connect()


export async function POST(request: NextRequest){

    try {
        const reqBody = await request.json()
        const {token} = reqBody;
        console.log('verify token received', token);

        // determine whether token is numeric OTP or link token
        let user = null;
        const now = Date.now();
        if (/^\d{4,6}$/.test(token)) {
            // treat as OTP code
            user = await User.findOne({otpToken: { $exists: true }, otpExpiry: {$gt: now}});
            if (user) {
                const match = await bcryptjs.compare(token, user.otpToken || '');
                if (!match) {
                    user = null;
                }
            }
        }
        if (!user) {
            // fallback to verify link
            user = await User.findOne({verifyToken: token, verifyTokenExpiry: {$gt: now}});
        }

        if (!user) {
            return NextResponse.json({error: "Invalid or expired token"}, {status: 400});
        }

        user.isVerified = true;
        // clear whichever token field used
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        user.otpToken = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        return NextResponse.json({
            message: "Email verified successfully",
            success: true
        });


    } catch (error) {
        // don't leak internal exception details to the client
    console.error("verifyemail error", error);
    const msg = (error instanceof Error && error.message) ? "Verification failed, please try again later" : "Verification failed";
    return NextResponse.json({error: msg}, {status: 500})
    }

}

// D:\PROJECTS\BACKEND\evolve\src\app\api\users\signup\route.ts
import {connect} from "../../../../dbConfig/dbConfig";
import User from "../../../../models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "../../../../helpers/mailer";


connect()


export async function POST(request: NextRequest){
    try {
        const reqBody = await request.json()
        const {username, email, password, channelId} = reqBody // Include channelId here

        console.log(reqBody);

        //check if user already exists
        const user = await User.findOne({email})

        if(user){
            return NextResponse.json({error: "User already exists"}, {status: 400})
        }

        //hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            channelId // Save the channelId here
        })

        const savedUser = await newUser.save()
        console.log(savedUser);

        //send verification OTP email instead of link
        await sendEmail({email, emailType: "OTP", userId: savedUser._id})

        return NextResponse.json({
            message: "User created successfully",
            success: true,
            savedUser
        })
        
    } catch (error: any) {
        // handle duplicate key (unique constraint) errors gracefully
        if (error.code === 11000) {
            // determine which field caused the duplicate
            const field = Object.keys(error.keyValue || {})[0] || 'field';
            const value = error.keyValue[field];
            return NextResponse.json({
                error: `The ${field} "${value}" is already in use. Please choose another.`
            }, { status: 400 });
        }
        // validation errors from mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors || {}).map((e: any) => e.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
    }
}

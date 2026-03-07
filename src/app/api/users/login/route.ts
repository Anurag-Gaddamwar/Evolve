// D:\PROJECTS\BACKEND\evolve\src\app\api\users\login\route.ts
import {connect} from "../../../../dbConfig/dbConfig";
import User from "../../../../models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

connect()

export async function POST(request: NextRequest){
    try {

        const reqBody = await request.json()
        const {email, password} = reqBody;
        // console.log(reqBody);

        //check if user exists
        const user = await User.findOne({email})
        if(!user){
            return NextResponse.json({error: "User does not exist"}, {status: 400})
        }
        // console.log("user exists");
        
        
        //check if password is correct
        const validPassword = await bcryptjs.compare(password, user.password)
        if(!validPassword){
            return NextResponse.json({error: "Invalid password"}, {status: 400})
        }
        // console.log(user);
        
        // prevent login if email not verified
        if (!user.isVerified) {
            return NextResponse.json({ error: "Email not verified" }, { status: 400 });
        }
        //create token data
        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email
        }
        //create token
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, {expiresIn: "1d"})

        // Clean up empty chats - keep only non-empty chats plus one empty chat max
        if (user.chats && Array.isArray(user.chats) && user.chats.length > 0) {
            const nonEmptyChats = user.chats.filter(chat => 
                chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0
            );
            const emptyChats = user.chats.filter(chat => 
                !chat.messages || !Array.isArray(chat.messages) || chat.messages.length === 0
            );
            
            // Keep all non-empty chats and only ONE empty chat if exists
            const chatsToKeep = [...nonEmptyChats];
            if (emptyChats.length > 0) {
                chatsToKeep.push(emptyChats[0]); // Keep only the first empty chat
            }
            
            // Update user with cleaned chats
            await User.updateOne(
                { _id: user._id },
                { $set: { chats: chatsToKeep } }
            );
        }

        const response = NextResponse.json({
            message: "Login successful",
            success: true,
        })
        response.cookies.set("token", token, {
            httpOnly: true, 
            
        })
        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({error: "Something went wrong. Please try again later."}, {status: 500})
    }
}

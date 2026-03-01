import {connect} from "../../../../dbConfig/dbConfig";
import User from "../../../../models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "../../../../helpers/mailer";

connect();

export async function POST(request: NextRequest){
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        const user = await User.findOne({ email });
        if (!user) {
            // don't reveal that user doesn't exist to avoid account enumeration
            return NextResponse.json({ message: "If that email is registered, you will receive a reset link" });
        }
        const { hashedToken } = await sendEmail({ emailType: 'RESET', userId: user._id, email });
        // in production the hashedToken would be sent by email; here we return it so frontend can navigate
        return NextResponse.json({ message: "Reset token generated", hashedToken, success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}

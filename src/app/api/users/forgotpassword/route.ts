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
            // email not found – inform the client so it can display proper feedback
            return NextResponse.json({ message: "Email is not registered", success: false });
        }
        // generate and email OTP
        const { hashedToken } = await sendEmail({ emailType: 'OTP', userId: user._id, email });
        // we do not return the OTP; only confirm
        return NextResponse.json({ message: "OTP sent to email", success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}

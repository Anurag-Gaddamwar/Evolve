import { connect } from "../../../../dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "../../../../models/userModel";
import { sendEmail } from "../../../../helpers/mailer";

connect();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ error: "Account already verified" }, { status: 400 });
    }

    // send a fresh OTP to the user
    await sendEmail({ emailType: "OTP", userId: user._id, email: user.email });

    return NextResponse.json({ message: "Verification code sent" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to resend" }, { status: 500 });
  }
}

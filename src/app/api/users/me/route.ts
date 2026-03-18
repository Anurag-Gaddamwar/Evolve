import { getDataFromToken } from "../../../../helpers/getDataFromToken";
import bcryptjs from 'bcryptjs';

import { NextRequest, NextResponse } from "next/server";
import User from "../../../../models/userModel";
import { connect } from "../../../../dbConfig/dbConfig";

connect();

export async function GET(request:NextRequest){

    try {
        const userId = await getDataFromToken(request);
        const user = await User.findOne({_id: userId}).select("-password");
        return NextResponse.json({
            message: "User found",
            data: user
        })
    } catch (error) {
        return NextResponse.json({error: (error as any).message}, {status: 401});
    }

}

// update password and/or channel ID
// update password and/or channel ID
export async function PUT(request: NextRequest) {
    try {
        const userId = await getDataFromToken(request);
        const body = await request.json();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 🔒 Guest user restrictions
        if (user.email === 'guestuser@gmail.com') {
            if (body.newPassword !== undefined) {
                return NextResponse.json(
                    { error: 'Sorry, guest account password cannot be changed. Please login with your own account.' },
                    { status: 403 }
                );
            }
            if (body.channelId !== undefined) {
                return NextResponse.json(
                    { error: 'Guest account channel cannot be changed.' },
                    { status: 403 }
                );
            }
        }

        const updates: any = {};

        // =========================
        // ✅ CHANNEL ID VALIDATION
        // =========================
        if (body.channelId !== undefined && body.channelId !== user.channelId) {
            const trimmedId = body.channelId.trim();

            if (
                !trimmedId ||
                trimmedId.length < 24 ||
                !/^[UC][A-Za-z0-9_-]{21}$/.test(trimmedId)
            ) {
                return NextResponse.json(
                    { error: 'Invalid YouTube channel ID format. Must be UC... (24 chars).' },
                    { status: 400 }
                );
            }

            updates.channelId = trimmedId;
        }

        // =========================
        // 🔐 PASSWORD VALIDATION
        // =========================
        if (body.newPassword) {
            // 1. Require current password
            if (!body.currentPassword) {
                return NextResponse.json(
                    { error: 'Current password required for password change' },
                    { status: 400 }
                );
            }

            // 2. Verify current password
            const isMatch = await bcryptjs.compare(body.currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json(
                    { error: 'Current password incorrect' },
                    { status: 401 }
                );
            }

            // 3. Prevent same password reuse
            if (body.currentPassword === body.newPassword) {
                return NextResponse.json(
                    { error: 'New password must be different from current password' },
                    { status: 400 }
                );
            }

            // 4. Confirm password match (optional but recommended)
            if (body.confirmPassword && body.newPassword !== body.confirmPassword) {
                return NextResponse.json(
                    { error: 'Passwords do not match' },
                    { status: 400 }
                );
            }

            // 5. Password strength validation
            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

            if (!passwordRegex.test(body.newPassword)) {
                return NextResponse.json(
                    {
                        error:
                            'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
                    },
                    { status: 400 }
                );
            }

            // 6. Hash password
            const salt = await bcryptjs.genSalt(10);
            updates.password = await bcryptjs.hash(body.newPassword, salt);
        }

        // =========================
        // 🚀 APPLY UPDATES
        // =========================
        if (Object.keys(updates).length > 0) {
            await User.findByIdAndUpdate(userId, updates);
        }

        return NextResponse.json({
            message: 'Account updated',
            success: true,
        });

    } catch (error) {
        return NextResponse.json(
            { error: (error as any).message },
            { status: 500 }
        );
    }
}

// delete self
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getDataFromToken(request);
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (user.email === 'guestuser@gmail.com') {
            return NextResponse.json({ error: 'Guest account cannot be deleted. Please login with your own account.' }, { status: 403 });
        }
        const body = await request.json();
        if (!body.currentPassword) {
            return NextResponse.json({ error: 'Current password required for deletion' }, { status: 400 });
        }
        const match = await bcryptjs.compare(body.currentPassword, user.password);
        if (!match) {
            return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
        }
        await User.findByIdAndDelete(userId);
        const res = NextResponse.json({ message: 'Account deleted' });
        res.cookies.set('token','',{maxAge:0});
        return res;
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 401 });
    }
}

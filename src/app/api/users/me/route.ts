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
export async function PUT(request: NextRequest) {
    try {
        const userId = await getDataFromToken(request);
        const body = await request.json();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        // Guest user restrictions
        if (user.email === 'guestuser@gmail.com') {
            if (body.newPassword !== undefined) {
                return NextResponse.json({ error: 'Sorry, guest account password cannot be changed. Please login with your own account.' }, { status: 403 });
            }
        }
// Client-side validation + basic server check (no YT API dependency)
        if (body.channelId !== undefined && body.channelId !== user.channelId) {
          const trimmedId = body.channelId.trim();
          if (!trimmedId || trimmedId.length < 10 || !/^[UC][A-Za-z0-9_-]{21}[0-9A-Za-z_-]*$/.test(trimmedId)) {
            return NextResponse.json({ error: 'Invalid YouTube channel ID format. Must be UC... (24 chars).' }, { status: 400 });
          }
        }
        // if user is trying to change password we must verify currentPassword
        let match = false;
        if (body.newPassword) {
            if (!body.currentPassword) {
                return NextResponse.json({ error: 'Current password required for password change' }, { status: 400 });
            }
            match = await bcryptjs.compare(body.currentPassword, user.password);
            if (!match) {
                return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
            }
        } else if (body.currentPassword) {
            // if password provided but only changing channelId, still verify optionally
            match = await bcryptjs.compare(body.currentPassword, user.password);
            if (!match) {
                return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
            }
        }
        const updates: any = {};
        if (body.channelId !== undefined) updates.channelId = body.channelId;
        if (body.newPassword) {
            const salt = await bcryptjs.genSalt(10);
            updates.password = await bcryptjs.hash(body.newPassword, salt);
        }
        if (Object.keys(updates).length) {
            await User.findByIdAndUpdate(userId, updates);
        }
        return NextResponse.json({ message: 'Account updated', success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 401 });
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

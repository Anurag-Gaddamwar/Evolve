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
        // if user is trying to change password we must verify currentPassword
        let user: any | null = null;
        if (body.newPassword) {
            if (!body.currentPassword) {
                return NextResponse.json({ error: 'Current password required for password change' }, { status: 400 });
            }
            user = await User.findById(userId);
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            const match = await bcryptjs.compare(body.currentPassword, user.password);
            if (!match) {
                return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
            }
        } else if (body.currentPassword) {
            // if password provided but only changing channelId, still verify optionally
            user = await User.findById(userId);
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            const match = await bcryptjs.compare(body.currentPassword, user.password);
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
        await User.findByIdAndDelete(userId);
        const res = NextResponse.json({ message: 'Account deleted' });
        res.cookies.set('token','',{maxAge:0});
        return res;
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 401 });
    }
}
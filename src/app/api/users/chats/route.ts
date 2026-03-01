import { NextRequest, NextResponse } from 'next/server';
import { connect } from '../../../../dbConfig/dbConfig';
import { getDataFromToken } from '../../../../helpers/getDataFromToken';
import User from '../../../../models/userModel';

connect();

export async function GET(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    const user = await User.findOne({ _id: userId }).select('chats');

    return NextResponse.json({
      success: true,
      chats: Array.isArray(user?.chats) ? user.chats : [],
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    const body = await request.json();
    const chats = Array.isArray(body?.chats) ? body.chats : [];

    await User.updateOne(
      { _id: userId },
      { $set: { chats } }
    );

    return NextResponse.json({
      success: true,
      message: 'Chats saved',
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

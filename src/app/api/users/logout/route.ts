// D:\PROJECTS\BACKEND\evolve\src\app\api\users\logout\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '../../../../dbConfig/dbConfig';
import { getDataFromToken } from '../../../../helpers/getDataFromToken';
import User from '../../../../models/userModel';

connect();

export async function GET(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    
    // Get current user chats
    const user = await User.findOne({ _id: userId }).select('chats');
    
    if (user && Array.isArray(user.chats) && user.chats.length > 0) {
      // Filter out empty chats (chats with no messages)
      const nonEmptyChats = user.chats.filter(chat => 
        chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0
      );
      
      // Save only non-empty chats
      await User.updateOne(
        { _id: userId },
        { $set: { chats: nonEmptyChats } }
      );
    }
    
    // Clear the token cookie and send a success response
    const response = NextResponse.json(
      {
        message: 'Logout successful',
        success: true,
      }
    );
    response.cookies.set('token', '', { httpOnly: true, expires: new Date(0) });
    return response;
  } catch (error) {
    // Handle any errors during logout
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

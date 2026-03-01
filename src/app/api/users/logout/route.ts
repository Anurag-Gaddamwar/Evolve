// D:\PROJECTS\BACKEND\evolve\src\app\api\users\logout\route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

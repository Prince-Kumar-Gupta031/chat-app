import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Update user offline status
    await db.user.update({
      where: { id: session.userId },
      data: { isOnline: false, lastSeen: new Date() },
    });

    // Create response and clear cookie
    const response = NextResponse.json({
      message: 'Logout successful',
    });

    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({
      message: 'Logout successful',
    });

    response.cookies.delete('auth-token');

    return response;
  }
}
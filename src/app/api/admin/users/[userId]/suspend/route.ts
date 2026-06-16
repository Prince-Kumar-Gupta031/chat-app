import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;

    // Update user status to SUSPENDED
    const user = await db.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED', isOnline: false },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    // Create notification for user
    await db.notification.create({
      data: {
        userId: userId,
        type: 'USER_SUSPENDED',
        title: 'Account Suspended',
        message: 'Your account has been suspended by the admin.',
      },
    });

    return NextResponse.json({
      message: 'User suspended successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    console.error('Suspend user error:', error);
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 }
    );
  }
}
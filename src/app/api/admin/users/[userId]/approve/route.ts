import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAdmin();

    const { userId } = params;

    // Update user status to APPROVED
    const user = await db.user.update({
      where: { id: userId },
      data: { status: 'APPROVED' },
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
        type: 'USER_APPROVED',
        title: 'Account Approved',
        message: 'Your account has been approved. You can now log in.',
      },
    });

    return NextResponse.json({
      message: 'User approved successfully',
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

    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    );
  }
}
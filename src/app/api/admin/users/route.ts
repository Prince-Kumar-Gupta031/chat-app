import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = status ? { status: status as any } : {};

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        department: true,
        role: true,
        status: true,
        profilePicture: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    // Count by status
    const pendingCount = await db.user.count({ where: { status: 'PENDING' } });
    const approvedCount = await db.user.count({ where: { status: 'APPROVED' } });
    const rejectedCount = await db.user.count({ where: { status: 'REJECTED' } });
    const suspendedCount = await db.user.count({ where: { status: 'SUSPENDED' } });
    const onlineCount = await db.user.count({ where: { isOnline: true } });

    return NextResponse.json({
      users,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        suspended: suspendedCount,
        online: onlineCount,
        total: pendingCount + approvedCount + rejectedCount + suspendedCount,
      },
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

    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
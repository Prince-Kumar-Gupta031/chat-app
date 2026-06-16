import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    // Get user statistics
    const totalUsers = await db.user.count();
    const pendingUsers = await db.user.count({ where: { status: 'PENDING' } });
    const approvedUsers = await db.user.count({ where: { status: 'APPROVED' } });
    const rejectedUsers = await db.user.count({ where: { status: 'REJECTED' } });
    const suspendedUsers = await db.user.count({ where: { status: 'SUSPENDED' } });
    const onlineUsers = await db.user.count({ where: { isOnline: true } });

    // Get message statistics
    const totalMessages = await db.message.count();

    // Get conversation statistics
    const totalConversations = await db.conversation.count();

    // Get unread notifications count
    const unreadNotifications = await db.notification.count({
      where: { isRead: false },
    });

    // Get users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Get messages sent in last 7 days
    const recentMessages = await db.message.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Get top active users (by messages sent)
    const topUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        _count: {
          select: { sentMessages: true },
        },
      },
      orderBy: { sentMessages: { _count: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      analytics: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          approved: approvedUsers,
          rejected: rejectedUsers,
          suspended: suspendedUsers,
          online: onlineUsers,
          recentRegistrations,
        },
        messages: {
          total: totalMessages,
          recentMessages,
        },
        conversations: {
          total: totalConversations,
        },
        notifications: {
          unread: unreadNotifications,
        },
        topUsers,
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

    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
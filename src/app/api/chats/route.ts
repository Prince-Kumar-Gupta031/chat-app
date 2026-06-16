import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let where: any = {
      OR: [
        { user1Id: session.userId },
        { user2Id: session.userId },
      ],
    };

    if (search) {
      where = {
        ...where,
        OR: [
          {
            user1: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            user2: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    const conversations = await db.conversation.findMany({
      where,
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Calculate unread count for current user
    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: conv.user1Id === session.userId ? conv.user1Unread : conv.user2Unread,
    }));

    return NextResponse.json({
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existing = await db.conversation.findFirst({
      where: {
        OR: [
          { user1Id: session.userId, user2Id: userId },
          { user1Id: userId, user2Id: session.userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    if (existing) {
      const conversationWithUnread = {
        ...existing,
        unreadCount: existing.user1Id === session.userId ? existing.user1Unread : existing.user2Unread,
      };
      return NextResponse.json({
        message: 'Conversation already exists',
        conversation: conversationWithUnread,
      });
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        user1Id: session.userId,
        user2Id: userId,
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    const conversationWithUnread = {
      ...conversation,
      unreadCount: conversation.user1Id === session.userId ? conversation.user1Unread : conversation.user2Unread,
    };

    return NextResponse.json({
      message: 'Conversation created successfully',
      conversation: conversationWithUnread,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
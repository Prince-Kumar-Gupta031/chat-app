import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await requireAuth();
    const { conversationId } = params;

    // Get conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of conversation
    if (conversation.user1Id !== session.userId && conversation.user2Id !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized to access this conversation' },
        { status: 403 }
      );
    }

    // Mark all unread messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        receiverId: session.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readStatus: 'READ',
        readAt: new Date(),
      },
    });

    // Reset unread count for user
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        [conversation.user1Id === session.userId ? 'user1Unread' : 'user2Unread']: 0,
      },
    });

    return NextResponse.json({
      message: 'Messages marked as read',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
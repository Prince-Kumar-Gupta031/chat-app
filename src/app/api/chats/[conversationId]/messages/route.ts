import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> } // FIXED
) {
  try {
    await requireAuth();

    const { conversationId } = await params; // FIXED

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const search = searchParams.get('search');

    let where: any = { conversationId };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    if (search) {
      where.content = {
        contains: search,
      };
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get messages error:', error);

    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> } // FIXED
) {
  try {
    const session = await requireAuth();

    const { conversationId } = await params; // FIXED

    const body = await req.json();

    const {
      content,
      receiverId,
      messageType = 'TEXT',
      fileUrl,
      fileName,
      fileSize,
    } = body;

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: 'Message content or file is required' },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (
      conversation.user1Id !== session.userId &&
      conversation.user2Id !== session.userId
    ) {
      return NextResponse.json(
        { error: 'Not authorized to send message in this conversation' },
        { status: 403 }
      );
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: session.userId,
        receiverId,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        readStatus: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    const actualReceiverId =
      conversation.user1Id === session.userId
        ? conversation.user2Id
        : conversation.user1Id;

    await db.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessage: content || fileName || 'Attachment',
        lastMessageAt: new Date(),
        [
          conversation.user1Id === session.userId
            ? 'user2Unread'
            : 'user1Unread'
        ]: {
          increment: 1,
        },
      },
    });

    await db.notification.create({
      data: {
        userId: actualReceiverId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${session.name} sent you a message`,
        relatedId: conversationId,
      },
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Send message error:', error);

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
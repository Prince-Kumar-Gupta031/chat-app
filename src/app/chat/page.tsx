'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useNotificationStore } from '@/stores/notification';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search,
  Send,
  MoreVertical,
  LogOut,
  Settings,
  User,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Loader2,
  Bell,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SOCKET_PORT = 3003;

export default function ChatPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const {
    conversations,
    currentConversation,
    messages,
    isTyping,
    typingUser,
    setConversations,
    setCurrentConversation,
    setMessages,
    addMessage,
    addConversation,
    updateConversation,
  } = useChatStore();
  const { notifications, unreadCount, setNotifications, setUnreadCount, addNotification, markAsRead } = useNotificationStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        // Load conversations
        await loadConversations();
        await loadNotifications();

        // Initialize socket
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003', {
  transports: ['polling','websocket'],
});

        newSocket.on('connect', () => {
          console.log('Connected to socket');
          newSocket.emit('user-connect', meData.user.id);
        });

        newSocket.on('receive-message', (message) => {
          addMessage(message);
          scrollToBottom();
        });

        newSocket.on('user-typing', (data) => {
          const { senderName } = data;
          // Only show typing if it's not the current user and in current conversation
          if (currentConversation) {
            const otherUser = currentConversation.user1Id === user?.id ? currentConversation.user2 : currentConversation.user1;
            if (otherUser.name === senderName) {
              // Update typing state
            }
          }
        });

        newSocket.on('user-stopped-typing', () => {
          // Clear typing state
        });

        newSocket.on('notification', (notification) => {
          addNotification(notification);
          toast.info(notification.title, { description: notification.message });
        });

        newSocket.on('user-online', (data) => {
          updateConversationUserStatus(data.userId, true);
        });

        newSocket.on('user-offline', (data) => {
          updateConversationUserStatus(data.userId, false);
        });

        setSocket(newSocket);
        setIsLoading(false);
      } catch (error) {
        console.error('Init error:', error);
        router.push('/login');
      }
    };

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateConversationUserStatus = (userId: string, isOnline: boolean) => {
    setConversations(
      conversations.map((conv) => {
        if (conv.user1.id === userId) {
          return { ...conv, user1: { ...conv.user1, isOnline } };
        }
        if (conv.user2.id === userId) {
          return { ...conv, user2: { ...conv.user2, isOnline } };
        }
        return conv;
      })
    );
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`/api/users?search=${userSearch}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    if (showNewChatDialog) {
      loadUsers();
    }
  }, [showNewChatDialog, userSearch]);

  const selectConversation = async (conversation: any) => {
  setShowMobileChat(true);

  setCurrentConversation(conversation);
  await loadMessages(conversation.id);
    

    // Mark messages as read
    if (socket) {
      socket.emit('message-read', { conversationId: conversation.id });
    }
    fetch(`/api/chats/${conversation.id}/read`, { method: 'POST' });

    // Join conversation room
    if (socket) {
      socket.emit('join-conversation', conversation.id);
    }

    // Update unread count in conversations
    updateConversation(conversation.id, { unreadCount: 0 });
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chats/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createConversation = async (userId: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        addConversation(data.conversation);
        selectConversation(data.conversation);
        setShowNewChatDialog(false);
      } else {
        toast.error(data.error || 'Failed to create conversation');
      }
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentConversation || isSending) return;

    setIsSending(true);
    const tempMessage = messageInput;
    setMessageInput('');

    try {
      const otherUser = currentConversation.user1Id === user?.id ? currentConversation.user2 : currentConversation.user1;

      const res = await fetch(`/api/chats/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tempMessage,
          receiverId: otherUser.id,
          messageType: 'TEXT',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addMessage(data.data);

        // Emit via socket
        if (socket) {
          socket.emit('new-message', data.data);
        }

        // Update conversation
        updateConversation(currentConversation.id, {
          lastMessage: tempMessage,
          lastMessageAt: new Date(),
        });

        // Reload conversations to get updated order
        await loadConversations();
      } else {
        setMessageInput(tempMessage);
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      setMessageInput(tempMessage);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (socket && currentConversation) {
      socket.emit('typing-start', {
        conversationId: currentConversation.id,
        senderId: user?.id,
        senderName: user?.name,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && currentConversation) {
          socket.emit('typing-stop', {
            conversationId: currentConversation.id,
            senderId: user?.id,
          });
        }
      }, 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getOtherUser = (conversation: any) => {
    return conversation.user1Id === user?.id ? conversation.user2 : conversation.user1;
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherUser(conv);
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div
  className={`${
    showMobileChat ? 'hidden md:flex' : 'flex'
  } w-full md:w-96 border-r flex-col bg-muted/10`}
>
        {/* Sidebar Header */}
        <div className="p-4 bg-emerald-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="bg-emerald-700 text-white">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{user?.name}</h2>
                <p className="text-xs text-emerald-100">{user?.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-700">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-200" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-emerald-700 border-emerald-700 text-white placeholder:text-emerald-200 focus:bg-emerald-800"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => loadUsers()}>
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Chat</DialogTitle>
                <DialogDescription>Select a user to start a conversation</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <ScrollArea className="h-64">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No users found</p>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-lg"
                        onClick={() => createConversation(u.id)}
                      >
                        <Avatar>
                          <AvatarImage src={u.profilePicture} />
                          <AvatarFallback>
                            {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-muted-foreground">{u.department}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to get started</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                return (
                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`w-full p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                      currentConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={otherUser.profilePicture} />
                          <AvatarFallback>
                            {otherUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{otherUser.name}</h3>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-emerald-600">{conversation.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
  className={`${
    showMobileChat ? 'flex' : 'hidden'
  } md:flex flex-1 flex-col`}
>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
  <button
    onClick={() => setShowMobileChat(false)}
    className="md:hidden text-xl font-bold"
  >
    ←
  </button>
                  <Avatar>
                    <AvatarImage src={getOtherUser(currentConversation).profilePicture} />
                    <AvatarFallback>
                      {getOtherUser(currentConversation).name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{getOtherUser(currentConversation).name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getOtherUser(currentConversation).isOnline ? (
                        <span className="text-emerald-600">Online</span>
                      ) : (
                        <span>Last seen {getOtherUser(currentConversation).lastSeen ? formatDate(getOtherUser(currentConversation).lastSeen) : 'N/A'}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.senderId === user?.id;
                    const showDate = index === 0 ||
                      new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-emerald-600 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 text-emerald-600">
                                {message.sender.name}
                              </p>
                            )}
                            {message.content && (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                              <span className="text-xs">{formatTime(message.createdAt)}</span>
                              {isOwn && (
                                <>
                                  {message.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-emerald-200" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && typingUser && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground">{typingUser} is typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
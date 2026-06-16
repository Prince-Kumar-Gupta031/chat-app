import { create } from 'zustand';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content?: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readStatus: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  receiver: {
    id: string;
    name: string;
    profilePicture?: string;
  };
}

interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  user1Unread: number;
  user2Unread: number;
  unreadCount: number;
  user1: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
    profilePicture?: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
  user2: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
    profilePicture?: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isTyping: boolean;
  typingUser: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setTyping: (isTyping: boolean, user?: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isTyping: false,
  typingUser: null,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  setTyping: (isTyping, user = null) => set({ isTyping, typingUser: user }),

  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),

  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, ...updates } : conv
    ),
    currentConversation: state.currentConversation?.id === conversationId
      ? { ...state.currentConversation, ...updates }
      : state.currentConversation,
  })),
}));
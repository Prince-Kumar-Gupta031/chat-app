# Secure Internal Communication Platform

A WhatsApp-style real-time chat application built with Next.js 16, Prisma, and Socket.IO for secure internal communication within organizations.

## Features

### User Management
- **User Registration** with admin approval workflow
- **Role-Based Access Control** (Admin/User)
- **User Status Management** (Pending, Approved, Rejected, Suspended)
- **Profile Management** (update name, department, change password)

### Admin Dashboard
- **User Management** - Approve, reject, suspend, and reactivate users
- **Analytics Dashboard** - Track total users, active users, messages, and pending approvals
- **User Search** - Filter users by name, email, or employee ID

### Real-Time Chat
- **WhatsApp-Style UI** - Clean, professional interface
- **One-to-One Messaging** - Private conversations between users
- **Real-Time Updates** - Instant message delivery via Socket.IO
- **Online/Offline Status** - See who's available
- **Typing Indicators** - Know when someone is typing
- **Read Receipts** - Check if messages have been read
- **Message Timestamps** - Date and time for each message
- **Message Search** - Find messages by content
- **Unread Count Badges** - Track unread messages

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt encryption
- **Protected Routes** - Role-based access control
- **Admin Approval System** - Users must be approved before access
- **Input Validation** - Zod schema validation

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Pre-built UI components
- **Socket.IO Client** - Real-time communication
- **Zustand** - State management
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - Database ORM
- **SQLite** - Database (development)
- **Socket.IO** - Real-time messaging (port 3003)
- **JWT (jose)** - Authentication tokens
- **Bcrypt** - Password hashing
- **Zod** - Input validation

## Project Structure

```
my-project/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── admin/         # Admin management
│   │   │   ├── chats/         # Chat operations
│   │   │   ├── profile/       # User profile
│   │   │   └── notifications/ # Notifications
│   │   ├── chat/              # Chat page
│   │   ├── admin/             # Admin dashboard
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── profile/           # Profile page
│   │   └── page.tsx           # Home/redirect page
│   ├── components/ui/         # UI components (shadcn/ui)
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── auth.ts            # Auth utilities
│   │   └── jwt.ts             # JWT utilities
│   └── stores/                # Zustand stores
│       ├── auth.ts            # Auth state
│       ├── chat.ts            # Chat state
│       └── notification.ts    # Notification state
├── mini-services/
│   └── chat-service/          # Socket.IO service (port 3003)
│       ├── index.ts           # Socket.IO server
│       ├── package.json
│       ├── prisma/
│       └── db/
└── scripts/
    ├── create-admin.ts        # Create admin user
    └── create-test-users.ts   # Create test users
```

## Database Schema

### Users
- id, name, email, employeeId, department
- role (ADMIN/USER), status (PENDING/APPROVED/REJECTED/SUSPENDED)
- profilePicture, isOnline, lastSeen
- createdAt, updatedAt

### Conversations
- id, user1Id, user2Id
- lastMessage, lastMessageAt
- user1Unread, user2Unread
- createdAt, updatedAt

### Messages
- id, conversationId, senderId, receiverId
- content, messageType (TEXT/IMAGE/PDF/DOCX/XLSX/PPTX/FILE)
- fileUrl, fileName, fileSize
- readStatus (SENT/DELIVERED/READ), isRead, readAt
- createdAt, updatedAt

### Notifications
- id, userId, type (NEW_MESSAGE/USER_APPROVED/USER_REJECTED/USER_SUSPENDED)
- title, message, isRead, relatedId
- createdAt

## Setup Instructions

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm

### Installation

1. **Clone and install dependencies**
```bash
cd my-project
bun install
```

2. **Set up database**
```bash
bun run db:push
```

3. **Create admin user**
```bash
bun run scripts/create-admin.ts
```

This will create an admin account with:
- Email: admin@drdo.intern
- Password: admin123
- Employee ID: ADMIN001

4. **Create test users** (optional)
```bash
bun run scripts/create-test-users.ts
```

This creates 3 test users (all in PENDING status):
- John Doe (john@drdo.intern, password123)
- Jane Smith (jane@drdo.intern, password123)
- Bob Johnson (bob@drdo.intern, password123)

5. **Start development servers**

Start the Next.js dev server (port 3000):
```bash
bun run dev
```

Start the Socket.IO service (port 3003):
```bash
cd mini-services/chat-service
bun index.ts &
# Or
bun run dev
```

### Running the Application

1. Open http://localhost:3000 in your browser
2. Log in with the admin account or register a new account
3. Admin users go to `/admin` dashboard
4. Regular users go to `/chat` interface

## Default Users

### Admin Account
- Email: admin@drdo.intern
- Password: admin123
- Role: ADMIN

### Test Users (after running create-test-users.ts)
- Email: john@drdo.intern, Password: password123
- Email: jane@drdo.intern, Password: password123
- Email: bob@drdo.intern, Password: password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/users?status=PENDING` - Get users by status
- `GET /api/admin/analytics` - Get dashboard analytics
- `POST /api/admin/users/[userId]/approve` - Approve user
- `POST /api/admin/users/[userId]/reject` - Reject user
- `POST /api/admin/users/[userId]/suspend` - Suspend user
- `POST /api/admin/users/[userId]/reactivate` - Reactivate user

### Chat
- `GET /api/chats?search=query` - Get user conversations
- `POST /api/chats` - Create new conversation
- `GET /api/chats/[conversationId]/messages?limit=50` - Get messages
- `POST /api/chats/[conversationId]/messages` - Send message
- `POST /api/chats/[conversationId]/read` - Mark messages as read
- `GET /api/users?search=query` - Search users

### Profile
- `PUT /api/profile` - Update profile
- `POST /api/profile` - Change password

### Notifications
- `GET /api/notifications?unreadOnly=true` - Get notifications
- `PUT /api/notifications` - Mark as read

## Socket.IO Events

### Client to Server
- `user-connect` - Connect user with userId
- `join-conversation` - Join conversation room
- `leave-conversation` - Leave conversation room
- `new-message` - Broadcast new message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `message-read` - Mark messages as read
- `send-notification` - Send notification to user

### Server to Client
- `receive-message` - Receive new message
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `notification` - Receive notification
- `user-online` - User came online
- `user-offline` - User went offline

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="your-secret-key-change-in-production"
```

## Admin Approval Workflow

1. **User Registration**
   - User fills registration form
   - Account created with status "PENDING"
   - User cannot login until approved

2. **Admin Review**
   - Admin views pending users in dashboard
   - Admin can:
     - **Approve** - User can login and access platform
     - **Reject** - User account marked as rejected
     - **Suspend** - Temporarily disable approved user
     - **Reactivate** - Re-enable suspended user

3. **User Notification**
   - Users receive notifications when account status changes
   - Notifications visible in the platform

## Development Scripts

```bash
bun run dev          # Start Next.js dev server (port 3000)
bun run lint         # Run ESLint
bun run db:push      # Push schema to database
bun run db:generate  # Generate Prisma Client
bun run db:migrate   # Run database migrations
bun run db:reset     # Reset database
```

## Testing the Application

### Testing Admin Dashboard
1. Login as admin@drdo.intern / admin123
2. Navigate to Pending tab
3. Approve/reject users
4. View analytics
5. Search and filter users

### Testing Chat Functionality
1. Login as regular user (e.g., john@drdo.intern / password123)
2. Click "New Chat" button
3. Select a user to chat with
4. Type and send messages
5. Verify real-time updates

### Testing Real-Time Features
1. Open two browser windows
2. Login as different users in each
3. Start a conversation
4. Send messages and verify instant delivery
5. Check typing indicators
6. Verify online/offline status

## Production Deployment

### Database
For production, consider using:
- PostgreSQL with Prisma Accelerate
- MySQL with connection pooling

### Security
- Change JWT_SECRET to a strong, random value
- Enable HTTPS
- Configure CORS properly
- Use environment variables for sensitive data
- Enable rate limiting on API routes

### Hosting
- Vercel (recommended for Next.js)
- AWS EC2 or ECS
- DigitalOcean
- Railway
- Render

## Troubleshooting

### Socket.IO Connection Issues
- Ensure Socket.IO service is running on port 3003
- Check firewall settings
- Verify WebSocket support in network

### Database Issues
- Run `bun run db:push` to sync schema
- Check `db/custom.db` file permissions
- Verify Prisma client generation

### Authentication Issues
- Clear browser cookies
- Check JWT_SECRET is set correctly
- Verify admin user exists in database

## Future Enhancements

- [ ] File upload support (PDF, DOCX, XLSX, PPTX, Images)
- [ ] Message reactions and emojis
- [ ] Voice messages
- [ ] Video calling
- [ ] Group conversations
- [ ] End-to-end encryption
- [ ] Two-factor authentication
- [ ] Mobile app (React Native)
- [ ] Message archiving and export
- [ ] Advanced search filters

## License

This project is developed for DRDO internship testing purposes.

## Support

For issues or questions, please contact the development team.
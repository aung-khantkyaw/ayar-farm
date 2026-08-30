# Ayar Farm API

## Overview

Ayar Farm API is a Node.js RESTful API designed for managing farming operations in Myanmar. It is built using TypeScript and Express, providing a robust and scalable solution for agricultural management with real-time capabilities via Socket.io.

## Features

- RESTful API architecture
- TypeScript for type safety
- Prisma ORM for database interactions
- Socket.io for real-time communication
- Redis for streaming and caching
- Cloudinary integration for media storage
- JWT-based authentication
- Firebase Admin for push notifications
- Data vectorization pipeline integration
- API key management for AI services

## Architecture

```
┌─────────────────┐
│   Server Entry  │
│   server.ts     │
└────────┬────────┘
         │
         ├───┬──────────────────────────────────────┐
         │   │                                      │
         ▼   ▼                                      ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Express App  │  │ Socket.io        │  │ HTTP Server      │
│   app.ts     │  │   socket.ts      │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
         │
         ├───┬──────────────────────────────────────┐
         │   │                                      │
         ▼   ▼                                      ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Routes     │  │  Controllers     │  │   Services       │
│              │  │                  │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
         │                  │                      │
         └──────────────────┴──────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Prisma ORM  │  │     Redis        │  │   Cloudinary     │
│              │  │                  │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
```

## Project Flow

### 1. Server Initialization (`server.ts`)

1. **Load Environment Variables** - Uses dotenv to load configuration
2. **Create HTTP Server** - Express app wrapped in HTTP server
3. **Initialize Socket.io** - Real-time communication setup
4. **Register Socket Handlers** - Event handlers for real-time features
5. **Start Listening** - Server listens on configured port (default 3000)

### 2. Application Setup (`app.ts`)

1. **Configure Express** - Trust proxy, timeout settings
2. **CORS Configuration** - Dynamic origin handling for development
3. **Middleware Setup** - JSON parsing, URL encoding, cookie parsing, logging
4. **Static Files** - Serve uploaded files from `/upload` directory
5. **Route Registration** - Mount all API routes

### 3. Request Flow

```
Client Request → Middleware → Routes → Controllers → Services → Database/External APIs
```

**Step-by-step:**
1. **Client Request** - HTTP request from client (web/mobile)
2. **Middleware** - Authentication, validation, logging
3. **Routes** - URL routing to appropriate controller
4. **Controllers** - Request validation, response formatting
5. **Services** - Business logic, external API calls
6. **Database** - Prisma ORM for PostgreSQL operations
7. **Response** - JSON response sent back to client

### 4. Real-time Communication (`socket.ts`)

- **Socket.io Initialization** - Configured with CORS and timeouts
- **Room Management** - Admin rooms, user-specific rooms
- **Event Emission** - Targeted notifications to users/admins
- **Handler Registration** - Custom event handlers in `sockets/`

### 5. Data Vectorization Pipeline

The API integrates with the AI Processor worker for content vectorization. Status is tracked **per API key** in the `EmbeddingRecord` table (one content item can be vectorized into multiple model-specific Qdrant collections):

**Flow:**
1. **Content Creation** - Posts, documents, knowledge base entries created
2. **Admin Trigger** - `PUT /data-vectorization/status` with `status: 'PROCESSING'` and optional `apiKeyId`
3. **Redis Stream** - Task published to `vector_task_stream` carrying content fields + `api_key_id`
4. **AI Processor** - Python worker embeds with THAT key's model (falls back to active key if absent)
5. **Vector Storage** - Embeddings stored in that key's collection (`<base>_<model>_<size>`)
6. **Record Update** - Worker upserts `EmbeddingRecord`: PROCESSING → COMPLETED (collectionName, vectorCount) or FAILED (attempts, lastError)
7. **Dashboard** - Per-key progress via `GET /all?apiKeyId=` and `GET /summary`

### 6. API Key Management

**Dynamic AI Service Configuration:**
1. **API Key CRUD** - Create, read, update, delete API keys
2. **Active Key Selection** - Only one active key at a time
3. **Redis Publishing** - Active status changes published to `api_key_updates` stream
4. **AI Processor Sync** - Python worker listens for key updates
5. **Usage Tracking** - Increment usage counter on each API call

## Components

### Core Files

- **`server.ts`** - HTTP server and Socket.io initialization
- **`app.ts`** - Express application configuration and middleware
- **`socket.ts`** - Socket.io setup and helper functions

### Routes (`src/routes/`)

- **`index.ts`** - Health check, database test, notification endpoints
- **`auth.ts`** - Authentication routes (login, register, logout)
- **`users.ts`** - User management
- **`crop.ts`** - Crops and pulses management
- **`livestock.ts`** - Livestock industry management
- **`machine.ts`** - Agricultural machinery management
- **`fish.ts`** - Fishery management
- **`document.ts`** - Document management
- **`resource.ts`** - Resource management (loans, agromet bulletins)
- **`post.ts`** - Social media posts
- **`chat.ts`** - Chat and messaging
- **`notification.ts`** - Notification management
- **`announcement.ts`** - Announcement management
- **`push-notification.ts`** - Push notification configuration
- **`device-token.ts`** - Device token management for push notifications
- **`api-key.ts`** - AI API key management
- **`knowledge-base.ts`** - Knowledge base management
- **`data-vectorization.ts`** - Data vectorization pipeline control

### Controllers (`src/controllers/`)

Business logic layer that handles HTTP requests and responses. Each controller corresponds to a route module.

### Services (`src/services/`)

Core business logic and external service integrations:
- **`auth.ts`** - Authentication and authorization
- **`api-key.ts`** - API key CRUD and Redis publishing
- **`data-vectorization.ts`** - Vectorization status management and Redis stream publishing
- **`chat.ts`** - Chat and conversation management
- **`document.ts`** - Document processing and Cloudinary integration
- **`post.ts`** - Post management and interactions
- **`push.ts`** - Push notification services (Firebase, APN)
- **`resource.ts`** - Resource management

### Middlewares (`src/middlewares/`)

- **`index.ts`** - Authentication, authorization, validation, error handling
- **`upload.ts`** - File upload configuration with Cloudinary

### Configuration (`src/config/`)

- **`redis.ts`** - Redis client setup and stream names
- **`firebase.ts`** - Firebase Admin configuration

### Database (`prisma/`)

- **`schema.prisma`** - Database schema and models
- **`seed.ts`** - Database seeding script
- **`migrations/`** - Database migration files

## Configuration

### Environment Variables (`.env`)

```env
# Server
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=rediss://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# JWT
JWT_SECRET=...

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Resend (for email)
RESEND_API_KEY=...
```

### Redis Streams

- **`api_key_updates`** - API key active status changes
- **`vector_task_stream`** - Vectorization tasks for AI processor

## Database Schema

### Key Models

**Users:**
- User authentication and profile management
- User types: ADMIN, FARMER, AGRICULTURAL_SPECIALIST, etc.
- Relations with posts, comments, notifications, conversations

**Post:**
- Social media posts
- Reactions, comments, media attachments
- Visibility settings (PUBLIC, COMMUNITY, PRIVATE)

**Documents:**
- Agricultural documents (crop docs, machine docs, etc.)
- PDF files stored in Cloudinary

**ApiKey:**
- AI service configuration
- Provider types: OPENROUTER, OPENAI, ANTHROPIC, GOOGLE, CUSTOM
- Model names (`llmModelName`, `embeddingModelName`), `vectorSize`, usage limits
- Active key selection for AI processor

**EmbeddingRecord:**
- Per-API-key vectorization tracking (`@@unique([apiKeyId, targetType, targetId])`)
- Status lifecycle: PENDING → PROCESSING → COMPLETED/FAILED
- Stores physical `collectionName`, `vectorCount`, `attempts`, `lastError`
- Missing row = content never attempted for that key

**KnowledgeBase:**
- Knowledge base entries with PDF content

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Data Vectorization (admin)
- `GET /api/data-vectorization/all?apiKeyId=...` - All content with per-key status merged (defaults to ACTIVE key; missing record = PENDING)
- `GET /api/data-vectorization/summary` - Per-API-key vectorization counts
- `PUT /api/data-vectorization/status` - Queue/update one item (`type`, `id`, `status`, optional `apiKeyId`)
- `PUT /api/data-vectorization/status/bulk` - Bulk queue/update (optional top-level `apiKeyId`)

### API Keys
- `GET /api/api-keys` - Get all API keys
- `POST /api/api-keys` - Create new API key
- `PUT /api/api-keys/:id` - Update API key
- `DELETE /api/api-keys/:id` - Delete API key

### Posts
- `GET /api/post` - Get posts
- `POST /api/post` - Create post
- `PUT /api/post/:id` - Update post
- `DELETE /api/post/:id` - Delete post

### Documents
- `GET /api/document` - Get documents
- `POST /api/document` - Upload document
- `PUT /api/document/:id` - Update document
- `DELETE /api/document/:id` - Delete document

### Knowledge Base
- `GET /api/knowledge-base` - Get knowledge base entries
- `POST /api/knowledge-base` - Create knowledge base entry
- `PUT /api/knowledge-base/:id` - Update knowledge base entry
- `DELETE /api/knowledge-base/:id` - Delete knowledge base entry

## Getting Started

### Prerequisites

- Node.js 22+
- npm (Node Package Manager)
- PostgreSQL database (Neon in production)
- Redis server (Upstash in production)
- Qdrant (Cloud in production)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ayar-farm-api.git
   cd ayar-farm/api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up database:

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed database (optional)
   npm run prisma:seed
   ```

5. Start development server:

   ```bash
   npm run dev
   ```

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Dependencies

### Core Dependencies
- `express` - Web framework
- `@prisma/client` - Database ORM
- `socket.io` - Real-time communication
- `ioredis` - Redis client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `cloudinary` - Media storage
- `multer` - File upload handling

### External Services
- `firebase-admin` - Firebase push notifications
- `node-apn` - Apple Push Notifications
- `twilio` - SMS services
- `nodemailer` - Email services
- `resend` - Email API

### Dev Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `prisma` - Database toolkit
- `nodemon` - Development auto-reload

## Real-time Features

### Socket.io Events

**Admin Events:**
- Join admin room
- Receive admin notifications
- Broadcast to all admins

**User Events:**
- Join user-specific room
- Receive private notifications
- Real-time chat messages

**Global Events:**
- System announcements
- Broadcast notifications

## Data Vectorization Integration

The API integrates with the AI Processor worker for semantic search capabilities:

1. **Content Creation** - Posts, documents, and knowledge base entries are created without any vector-specific state
2. **Manual Trigger** - Admin queues items via the data-vectorization endpoints (optionally targeting a non-active API key)
3. **Redis Streaming** - Tasks are published to `vector_task_stream` carrying content fields + `api_key_id`
4. **Per-Key Tracking** - The Python worker upserts `EmbeddingRecord` rows (status, collection, vector count, attempts, errors)
5. **Completion** - Vectorized content becomes searchable via Qdrant in that model's dedicated collection (`<base>_<model>_<size>`)

## Error Handling

The API includes comprehensive error handling:
- Middleware-level error catching
- Service-level error logging
- Database transaction rollback on failures
- Redis error handling with fallback
- Detailed error responses to clients

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Role-based access control (ADMIN, FARMER, etc.)
- Input validation and sanitization
- SQL injection prevention via Prisma ORM

## Monitoring

The API provides:
- Morgan HTTP request logging
- Custom error logging
- Redis connection status logging
- Database query logging
- Socket.io connection logging

## License

Part of the Ayar Farm project.
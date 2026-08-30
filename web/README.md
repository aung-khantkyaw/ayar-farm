# AyeyarFarm Web Dashboard

## Overview

AyeyarFarm Web Dashboard is a React-based admin panel designed for managing the AyeyarFarm agricultural platform in Myanmar. Built with TypeScript and modern web technologies, it provides a comprehensive interface for content management, user administration, and data analytics.

## Features

- Modern React 19 with TypeScript
- File-based routing with TanStack Router
- Real-time updates via Socket.io
- Responsive design with TailwindCSS
- Reusable UI components with Shadcn
- Data visualization with Recharts
- Form handling with React Hook Form
- AI admin suite: API key management, key-aware vectorization dashboard, knowledge base, RAG playground

## Getting Started

### Prerequisites

- Node.js 22+
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ayar-farm.git
   cd ayar-farm/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory and add your configuration settings, such as API base URL.

### Running the Application

- For development mode, use:

  ```bash
  npm run dev
  ```

- To build and start the application in production mode, use:

  ```bash
  npm run build
  npm run preview
  ```

## Testing

Run tests with:

```bash
npm run test
```

## Project Structure

### `/src/app`

Page components organized by feature:

- `admin/` - Admin management pages (applications, chat-room, users, videos)
- `ai/` - AI admin pages:
  - `api-keys.tsx` - Manage AI provider keys (provider, models, vector size, active toggle)
  - `data-vectorization.tsx` - Key-aware vectorization dashboard (per-API-key status via `EmbeddingRecord`, bulk queueing)
  - `knowledge-base.tsx` - Knowledge base CRUD with active-key embedding status
  - `ai-playground.tsx` - RAG chat playground with streaming responses and source chips
- `categories/` - Category pages (crops, fisheries, livestock, machines)
- `auth.tsx` - Authentication page
- `home.tsx` - Dashboard home

### `/src/components`

- `ui/` - Shadcn UI components (buttons, forms, tables, dialogs)
- `dashboard/` - Dashboard widgets (stats, market-weather)
- Layout components (sidebar, header, navigation)
- Feature components (data-table, chat-room-management)

### `/src/routes`

File-based routing with TanStack Router:

- `__root.tsx` - Root layout
- `index.tsx` - Home route
- `login.tsx`, `forgot-password.tsx`, `reset-password.tsx` - Auth routes
- `admin.*` - Admin routes
- `ai.*` - AI admin routes (`ai.api-keys`, `ai.data-vectorization`, `ai.knowledge-base`, `ai.ai-playground`)
- `category.*` - Category routes
- `dashboard.tsx` - Dashboard route

### `/src/providers`

Context providers for state management:

- `auth-provider.tsx` - Authentication state
- `admin-provider.tsx` - Admin data
- `socket-provider.tsx` - Real-time connections
- Category providers (crop, fishery, livestock, machine)

### `/src/lib`

- `api.ts` - API client functions
- `config.ts` - App configuration
- `interface.ts` - TypeScript interfaces
- `socket.ts` - Socket.io client
- `utils.ts` - Helper utilities

### `/src/hooks`

Custom React hooks (e.g., `use-mobile.ts`)

## Development

### Adding Routes

Create files in `src/routes/` following the naming convention:

- `page-name.tsx` for `/page-name`
- `parent.child.tsx` for `/parent/child`

### Adding UI Components

```bash
pnpx shadcn@latest add [component]
```

### Data Fetching

Use TanStack Router loaders or React Query for API calls via `lib/api.ts`

### AI Vectorization Dashboard

`app/ai/data-vectorization.tsx` is **API-key aware**:

- A key selector (defaults to the ★ ACTIVE key) drives `GET /data-vectorization/all?apiKeyId=...`
- Item statuses come from `EmbeddingRecord` per that key — missing record renders as PENDING
- "Vectorize Now" queues tasks with the selected key's id; the Python worker embeds with that key's model and stores into its dedicated collection (`<base>_<model>_<size>`)
- Per-key counts via `GET /data-vectorization/summary`

### Real-time Features

Socket.io client configured in `lib/socket.ts`, wrapped by `socket-provider.tsx`

## Learn More

- [TanStack Router](https://tanstack.com/router)
- [Shadcn UI](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

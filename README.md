# AyarFarm Link MSME

A cross-platform agricultural knowledge and management system designed specifically for farmers in Myanmar. This solution connects the agricultural community with expert knowledge, real-time market information, and support networks.

The platform consists of two main components:

- **Mobile App:** A user-friendly application for farmers (end-users) to access resources, track crops, and connect with experts.
- **Web Dashboard:** A comprehensive admin panel for managing content, users, and analyzing platform data.

## Project Structure

```structure
ayar-farm/
├── api/            # Node.js REST API (Express + Prisma)
├── web/            # React web application (Vite + TypeScript)
├── mobile/         # Flutter mobile application
├── docker-compose.dev.yml # Development Docker Compose
└── docker-compose.yml     # Production Docker Compose
```

## Tech Stack

### API

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL (Local or Neon)
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Storage:** Cloudinary
- **Authentication:** JWT
- **Services:** Twilio (SMS), Nodemailer (Email)

### Web

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **Routing:** TanStack Router
- **UI Components:** Radix UI, Lucide React
- **State/Data:** TanStack Table, React Hook Form
- **Visualization:** Recharts
- **Real-time:** Socket.io Client

### Mobile

- **Framework:** Flutter 3.7+
- **Language:** Dart
- **Key Packages:**
  - `http`: API communication
  - `geolocator`: Location services

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Flutter SDK 3.7+ (for mobile development)

## Quick Start

### Using Docker

You can run the project in either Development mode (with hot-reload) or Production mode.

#### Development Mode

Use this for local development. Changes to the code will automatically reload the services.

```bash
# Start services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Services will be available at:
# API: http://localhost:3000
# Web: http://localhost:5173
# Mobile (Web): http://localhost:8080
# Database: localhost:5432
```

#### Production Mode

Use this to simulate a production environment. This uses the built artifacts and does not support hot-reload.

```bash
# Start services in production mode
docker-compose up -d --build

# Services will be available at:
# API: http://localhost:3000
# Web: http://localhost:5173
# Mobile (Web): http://localhost:8080
# Database: localhost:5432
```

#### Understanding Run Modes

- **With `-d` (Detached Mode):**
  - Runs containers in the background.
  - Terminal is free for other commands.
  - Use `docker-compose logs -f` to view logs.
  - Stop with `docker-compose down`.

- **Without `-d` (Foreground Mode):**
  - Runs containers in the current terminal.
  - Shows live logs from all services.
  - Useful for debugging and seeing immediate errors.
  - Stop with `Ctrl+C`.

**Note:** The mobile service builds Flutter for web and serves it via nginx. For native mobile development, see the Mobile Setup section below.

## Local Development

### Database Setup

If you are running the API locally without Docker, you need a PostgreSQL database. You can use the one provided by Docker or a remote one (e.g., Neon).

```bash
# Start only the database container
docker-compose up -d database
```

### API Setup

```bash
cd api
npm install
cp .env.example .env

# Update .env with your configuration
# Ensure DATABASE_URL points to your local or remote database

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed # Optional: Seed initial data
npm run dev
```

### Web Setup

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
flutter pub get

# For native mobile development, run on an emulator or connected device
flutter run

# For web version, run:
flutter run -d web-server

# To build for Android or iOS, ensure you have the respective SDKs set up.
flutter build apk --release --dart-define=API_BASE_URL=https://ayarfarmlink-api.onrender.com/api
flutter build ios --release --dart-define=API_BASE_URL=https://ayarfarmlink-api.onrender.com/api

# To build APK with obfuscation and split per ABI
flutter build apk --release --split-per-abi --obfuscate --split-debug-info=build/debug-info --dart-define=API_BASE_URL=https://ayarfarmlink-api.onrender.com/api
```

## Environment Variables

Check `.env.example` in `api/` and `web/` directories for required environment variables.

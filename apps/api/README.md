# Ayar Farm API

## Overview

Ayar Farm API is a Node.js RESTful API designed for managing farming operations in Myanmar. It is built using TypeScript and Express, providing a robust and scalable solution for agricultural management.

## Features

- RESTful API architecture
- TypeScript for type safety
- Prisma for database interactions
- Middleware support for authentication and logging
- Cloudinary integration for media storage

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- PostgreSQL or another supported database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ayar-farm-api.git
   cd ayar-farm-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory and add your configuration settings, such as database connection strings and API keys.

### Database Setup

1. Update the `prisma/schema.prisma` file to define your database schema.
2. Run the following command to generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

3. Run migrations to set up your database:

   ```bash
   npm run prisma:migrate
   ```

4. (Optional) Seed your database with initial data:

   ```bash
   npm run prisma:seed
   ```

### Running the Application

- For development mode, use:

  ```bash
  npm run dev
  ```

- To build and start the application in production mode, use:

  ```bash
  npm run build
  npm start
  ```

## API Documentation

Refer to the API documentation for details on available endpoints and their usage.
# Game Overlay System

A collaborative live quiz and overlay system.

## Project Structure

- `live-quiz-master`: Frontend application built with React, Vite, and Tailwind CSS.
- `nest-overlay-api`: Backend API built with NestJS and Prisma.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   ```

2. Install dependencies for the frontend:
   ```sh
   cd live-quiz-master
   npm install
   ```

3. Install dependencies for the backend:
   ```sh
   cd ../nest-overlay-api
   npm install
   ```

### Running the Application

1. Start the backend:
   ```sh
   cd nest-overlay-api
   npm run start:dev
   ```

2. Start the frontend:
   ```sh
   cd live-quiz-master
   npm run dev
   ```

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Socket.io-client.
- **Backend**: NestJS, Prisma, PostgreSQL (or your database).
- **Communication**: WebSockets (Socket.io).

## License

MIT

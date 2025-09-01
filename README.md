# iGaming Lobby System

A real-time multiplayer number guessing game lobby system built with NestJS backend and Next.js frontend.

## Features

- **User Authentication**: JWT-based registration and login system
- **Real-time Game Sessions**: 20-second duration sessions with Socket.IO
- **Number Guessing Game**: Players pick numbers 1-9, winners determined randomly
- **Queue System**: Automatic queue management when sessions are full
- **Leaderboard**: Top players tracking with time-based filtering
- **Session Management**: Complete session history and statistics
- **Responsive UI**: Clean, modern interface with Tailwind CSS

## Tech Stack

### Backend
- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL database
- Socket.IO for real-time communication
- JWT authentication
- Swagger API documentation

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Socket.IO client
- Axios for API calls
- Lucide React icons

### Infrastructure
- Docker & Docker Compose
- PostgreSQL database
- pgAdmin for database management

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd igaming-lobby-system
```

2. Start all services with Docker Compose:
```bash
docker-compose up -d
```

3. Wait for all services to start, then access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **pgAdmin**: http://localhost:8080 (admin@igaming.com / admin123)

### Local Development Setup

#### Backend Setup
```bash
cd iGaming-backend
npm install
cp .env.example .env  # Configure your environment variables
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

#### Frontend Setup
```bash
cd iGaming-frontend
npm install
npm run dev
```

### Database Setup

The database will be automatically created when using Docker Compose. For local development:

1. Create a PostgreSQL database named `igaming`
2. Update the `DATABASE_URL` in your `.env` file
3. Run migrations:
```bash
cd iGaming-backend
npx prisma migrate dev
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/igaming?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
SESSION_DURATION=20
MAX_PLAYERS_PER_SESSION=10
PORT=3001
```

### Frontend
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Game Rules

1. **Registration/Login**: Users must register or login with a username
2. **Session Joining**: Users can join active sessions or start new ones
3. **Number Selection**: Players pick a number from 1-9 during the 20-second window
4. **Winner Determination**: A random winning number is selected when time expires
5. **Results**: Players who picked the winning number are declared winners
6. **Queue System**: When sessions are full (10 players), additional users are queued
7. **Session Restrictions**: Users cannot login if they have an active session

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Game Management
- `GET /game/status` - Get current session status
- `POST /game/join` - Join current session
- `DELETE /game/leave` - Leave current session
- `POST /game/choose-number` - Choose a number (1-9)

### Leaderboard
- `GET /leaderboard/top-players` - Get top 10 players by wins
- `GET /leaderboard/sessions` - Get sessions grouped by date
- `GET /leaderboard/winners?period=day|week|month` - Get winners by time period

## Real-time Events

The application uses Socket.IO for real-time communication:

- `sessionStatus` - Current session information and countdown
- `gameResult` - Game results with winners and statistics
- `requestSessionStatus` - Client requests for session updates

## Project Structure

```
├── docker-compose.yml
├── iGaming-backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── game/          # Game logic and session management
│   │   ├── leaderboard/   # Statistics and leaderboard
│   │   └── prisma/        # Database service
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── Dockerfile
├── iGaming-frontend/
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   └── hooks/         # Custom React hooks
│   └── Dockerfile
└── README.md
```

## Docker Services

- **postgres**: PostgreSQL database
- **pgadmin**: Database administration interface
- **backend**: NestJS API server
- **frontend**: Next.js application

## Development

### Running Tests
```bash
# Backend tests
cd iGaming-backend
npm run test

# Frontend tests  
cd iGaming-frontend
npm run test
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
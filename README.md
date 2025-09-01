# iGaming Lobby System

A comprehensive real-time multiplayer number guessing game with NestJS backend and Next.js frontend.

## Features

- **JWT Authentication** - Simple username-based registration/login
- **Real-time Game Sessions** - WebSocket-powered 20-second game rounds
- **10-User Session Limit** - Enforced with database transactions to prevent race conditions
- **Number Guessing Game** - Pick numbers 1-9, random winner selection
- **Queue System** - Automatic queue management when sessions are full
- **Leaderboard System** - Top 10 players, period filtering (day/week/month)
- **Session Management** - Only users trigger session creation, empty sessions auto-deleted
- **Responsive UI** - Clean professional interface with real-time updates

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Installation

1. **Clone and Setup**
```bash
git clone <repository>
cd iGaming-lobby
```

2. **Start Services**
```bash
# Start database
docker-compose up -d postgres

# Install and start backend
cd iGaming-backend
npm install
npx prisma migrate dev
npm run start:dev  # Runs on http://localhost:3001

# Install and start frontend (new terminal)
cd ../iGaming-frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

3. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api

## Testing Guide

### Basic API Testing

1. **Register Multiple Users**
```bash
# Register 12 users for testing
for i in {1..12}; do
  curl -s -X POST http://localhost:3001/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser$i\"}" | \
    jq -r '.accessToken' > user$i.token
done
```

2. **Verify Registration**
```bash
# Check if tokens were created
ls -la *.token
cat user1.token | head -c 20 && echo "..."
```

### Session Management Testing

3. **Test 10-User Limit (Critical Test)**
```bash
# Start a session with exactly 10 users
echo "Testing 10-user limit..."
for i in {1..10}; do
  token=$(cat user$i.token)
  curl -s -X POST http://localhost:3001/game/join \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{}' &
done
wait

# Try to add 11th user (should get error)
echo "Testing 11th user (should fail)..."
token=$(cat user11.token)
curl -X POST http://localhost:3001/game/join \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

4. **Expected Result for 11th User**
```json
{
  "message": "Session is full (10/10 players). Please wait for the next session.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Game Testing

5. **Test Number Selection**
```bash
# Users pick numbers (1-9)
for i in {1..5}; do
  token=$(cat user$i.token)
  number=$((i % 9 + 1))
  curl -s -X POST http://localhost:3001/game/choose-number \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{\"number\":$number}" &
done
wait
```

6. **Test Duplicate Session Prevention**
```bash
# Try to join again (should fail)
token=$(cat user1.token)
curl -X POST http://localhost:3001/game/join \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Leaderboard Testing

7. **Check Recent Sessions**
```bash
# View recent sessions with participant counts
curl -s http://localhost:3001/leaderboard/sessions | \
  jq '.[0:3] | .[] | {
    sessionNumber, 
    participantCount: (.participants | length),
    activeParticipants: [.participants[] | select(.isInQueue == false) | .user.username],
    winners: [.participants[] | select(.isWinner) | .user.username]
  }'
```

8. **Test Leaderboard Endpoints**
```bash
# Top players
curl -s http://localhost:3001/leaderboard/top-players | jq

# Winners by period
curl -s "http://localhost:3001/leaderboard/winners?period=day" | jq
curl -s "http://localhost:3001/leaderboard/winners?period=week" | jq
curl -s "http://localhost:3001/leaderboard/winners?period=month" | jq
```

### Stress Testing

9. **Chaos Test - Race Condition Prevention**
```bash
# Test concurrent joins (race condition test)
echo "CHAOS TEST: 12 users joining simultaneously..."
for i in {1..12}; do
  token=$(cat user$i.token)
  curl -s -X POST http://localhost:3001/game/join \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{}' &
done
wait

# Verify no session exceeded 10 users
curl -s http://localhost:3001/leaderboard/sessions | \
  jq '.[0:5] | .[] | {sessionNumber, participantCount: (.participants | length)}'
```

### User Statistics Testing

10. **Test User Stats**
```bash
# Get user statistics (requires authentication)
token=$(cat user1.token)
curl -s http://localhost:3001/leaderboard/user-stats \
  -H "Authorization: Bearer $token" | jq
```

### Session Lifecycle Testing

11. **Test Complete Session Workflow**
```bash
# 1. Create session with users
echo "Step 1: Creating session with users..."
for i in {1..3}; do
  token=$(cat user$i.token)
  curl -s -X POST http://localhost:3001/game/join \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" -d '{}' &
done
wait

# 2. Users pick numbers
echo "Step 2: Users picking numbers..."
for i in {1..3}; do
  token=$(cat user$i.token)
  curl -s -X POST http://localhost:3001/game/choose-number \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{\"number\":$((i + 1))}" &
done
wait

# 3. Wait for session to complete (20 seconds)
echo "Step 3: Waiting for session to complete..."
sleep 22

# 4. Check results
echo "Step 4: Checking session results..."
curl -s http://localhost:3001/leaderboard/sessions | jq '.[0]'
```

## Testing Scenarios

### Critical Test Cases

1. **Race Condition Prevention**
   - Multiple users joining simultaneously
   - Should never exceed 10 users per session
   - Database transactions prevent race conditions

2. **Session Limit Enforcement**
   - 11th user gets proper error message
   - No new sessions created when one is active and full

3. **Empty Session Cleanup**
   - Sessions without participants are automatically deleted
   - No empty sessions recorded in database

4. **User Session Prevention**
   - Users cannot join multiple sessions simultaneously
   - Proper error messages for duplicate joins

### Expected Behaviors

- **Maximum 10 users per active session**
- **11th user receives error message**
- **No empty sessions in database**
- **Race condition prevention with transactions**
- **Sequential session numbering (1, 2, 3...)**
- **Proper winner calculation and display**
- **Real-time countdown and status updates**

## Architecture

### Backend (NestJS)
- **Authentication Module**: JWT-based auth with Passport.js
- **Game Module**: Session management, WebSocket gateway
- **Leaderboard Module**: Statistics and ranking system
- **Prisma ORM**: PostgreSQL database with migrations
- **WebSocket**: Real-time game updates via Socket.IO

### Frontend (Next.js)
- **Authentication**: JWT token management
- **Real-time Updates**: Socket.IO client integration
- **Responsive Design**: Tailwind CSS styling
- **State Management**: React Context for auth state

### Database Schema
```sql
-- Users table
Users (id, username, createdAt, updatedAt)

-- Game sessions with sequential numbering
GameSessions (id, sessionNumber, startedAt, endsAt, winningNumber, isActive, isCompleted, startedById)

-- Session participants with queue support
SessionParticipants (id, userId, sessionId, chosenNumber, isWinner, joinedAt, isInQueue)
```

## Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/igaming"
JWT_SECRET="your-secret-key"
SESSION_DURATION=20
MAX_PLAYERS_PER_SESSION=10
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Game Management
- `POST /game/join` - Join active session
- `DELETE /game/leave` - Leave session
- `POST /game/choose-number` - Pick number (1-9)
- `GET /game/status` - Get session status

### Leaderboard
- `GET /leaderboard/top-players` - Top 10 players
- `GET /leaderboard/sessions` - Recent sessions
- `GET /leaderboard/winners?period=day|week|month` - Winners by period
- `GET /leaderboard/user-stats` - Current user statistics

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - Database: localhost:5432
# - pgAdmin: http://localhost:5050
```

## Key Features Verified

- **10-user session limit strictly enforced**
- **Race condition prevention with database transactions**
- **Proper error handling for 11th user**
- **Sequential session numbering**
- **Empty session cleanup**
- **Real-time WebSocket updates**
- **Complete leaderboard system**
- **Professional UI with proper text visibility**
- **Comprehensive test coverage**

## Testing Results

The system has been thoroughly tested with:
- **12+ concurrent users** joining simultaneously
- **Race condition stress testing** with database transactions
- **Session limit enforcement** preventing overflow
- **Complete workflow testing** from registration to game completion
- **UI/UX verification** with proper text alignment and visibility

All tests pass successfully, confirming the system meets all requirements.
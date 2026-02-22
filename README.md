# Multi-Tenant SaaS API

A multi-tenant, subscription-based SaaS backend with real-time WebSocket notifications built with **Bun**, **Hono**, **Drizzle ORM**, and **PostgreSQL**.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Bun | Runtime + package manager |
| Hono | Web framework |
| Drizzle ORM | Database ORM |
| PostgreSQL | Database |
| Zod | Request validation |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| WebSocket (Bun native) | Real-time notifications |
| Docker | Containerization |

---

## Features

- JWT authentication with access + refresh token rotation
- Role-based access control (Admin, Member)
- Multi-tenant architecture with strict org data isolation
- Subscription plans with user limits (Free, Pro, Enterprise)
- Real-time WebSocket notifications
- Activity feed / audit log
- Admin broadcast messages
- Rate limiting
- Swagger API documentation
- Docker + docker-compose setup

---

## Project Structure

```
src/
├── config/
│   ├── env.ts              # Environment variable config
│   └── swagger.ts          # Swagger/OpenAPI spec
├── db/
│   ├── index.ts            # Drizzle client
│   └── schema.ts           # Database schema
├── middleware/
│   ├── auth.ts             # JWT verification middleware
│   ├── role.ts             # Role-based access control
│   └── errorHandler.ts     # Centralized error handler
├── modules/
│   ├── auth/               # Register, login, refresh, logout
│   ├── organisations/      # Get org, upgrade plan, broadcast
│   ├── users/              # List, invite, accept invite, remove
│   └── activity/           # Activity feed
├── websocket/
│   ├── wsManager.ts        # WebSocket connection registry
│   └── events.ts           # WebSocket event types
├── utils/
│   ├── ApiError.ts         # Custom error class
│   ├── jwt.ts              # JWT utilities
│   └── response.ts         # Standardized response helpers
├── types/
│   └── hono.ts             # Hono context variable types
└── index.ts                # App entry point
```

---

## Database Schema

```
Organisation
  │
  ├── User (organisationId FK)
  │     └── RefreshToken (userId FK)
  │
  ├── Invite (organisationId FK)
  │
  └── Activity (organisationId FK)
        ├── actor → User (nullable)
        └── target → User (nullable)
```

### Subscription Plans

| Plan | Member Limit |
|---|---|
| FREE | 3 |
| PRO | 10 |
| ENTERPRISE | Unlimited |

---

## Setup Instructions

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) + Docker Compose
- PostgreSQL (if running locally without Docker)

### Option 1 — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/multi-tenant-api.git
cd multi-tenant-api

# 2. Copy environment variables
cp .env.example .env

# 3. Update .env with your secrets (see Environment Variables section)

# 4. Start everything
docker-compose up --build
```

The API will be available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/docs`

### Option 2 — Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/multi-tenant-api.git
cd multi-tenant-api

# 2. Install dependencies
bun install

# 3. Copy and configure environment variables
cp .env.example .env

# 4. Run database migrations
bunx drizzle-kit migrate

# 5. Start the development server
bun dev
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/multitenant"

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Docker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=multitenant
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register + create organisation |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | ✓ | Logout + revoke token |

### Organisations

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/organisations` | ✓ | Any | Get organisation details |
| PATCH | `/api/organisations/subscription` | ✓ | Admin | Upgrade subscription plan |
| POST | `/api/organisations/broadcast` | ✓ | Admin | Broadcast message to org |

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/users` | ✓ | Admin | List all org users |
| POST | `/api/users/invite` | ✓ | Admin | Invite user to org |
| POST | `/api/users/accept-invite` | — | — | Accept invite |
| DELETE | `/api/users/:id` | ✓ | Admin | Remove user from org |

### Activity

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/activities` | ✓ | Get org activity feed |

### WebSocket

| Endpoint | Auth | Description |
|---|---|---|
| `ws://localhost:3000/ws?token=<access_token>` | ✓ | Real-time channel |

---

## WebSocket Events

Connect with a valid access token as a query parameter:

```js
const ws = new WebSocket("ws://localhost:3000/ws?token=YOUR_ACCESS_TOKEN")
ws.onmessage = (e) => console.log(JSON.parse(e.data))
```

### Event Types

```json
// User joined the organisation
{ "type": "USER_JOINED", "payload": { "userId": "...", "name": "...", "email": "...", "role": "..." } }

// Subscription plan upgraded
{ "type": "PLAN_UPGRADED", "payload": { "from": "FREE", "to": "PRO", "upgradedAt": "..." } }

// Admin broadcast message
{ "type": "BROADCAST_MESSAGE", "payload": { "message": "...", "sentBy": "...", "sentAt": "..." } }

// User removed from organisation
{ "type": "USER_REMOVED", "payload": { "userId": "...", "removedBy": "..." } }
```

---

## Rate Limiting

| Scope | Limit |
|---|---|
| Global | 100 requests / minute |
| Auth routes | 10 requests / minute |

---

## Architectural Decisions

### Multi-Tenancy
Every `User` has a hard foreign key to `Organisation`. The auth middleware extracts `organisationId` from the JWT and every database query is scoped to that org — making cross-org data leaks structurally impossible.

### JWT Strategy
Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in the database. Refresh tokens are rotated on every use and can be revoked by deleting the row — enabling proper session management without a cache layer.

### Drizzle over Prisma
Drizzle was chosen for its TypeScript-first schema definition, lighter bundle size, and thinner abstraction layer that stays close to raw SQL. The schema lives in `src/db/schema.ts` as plain TypeScript — no separate DSL file needed.

### WebSocket Architecture
An in-memory `Map<orgId, Set<ServerWebSocket>>` acts as the room registry. This works perfectly for single-server deployments. For horizontal scaling, the registry can be swapped for a Redis pub/sub adapter with minimal code changes.

### Activity Log as Event Source
Every significant action (user joined, plan upgraded, broadcast) is written to the `activities` table first, then broadcast via WebSocket. This means the activity feed and real-time notifications share one source of truth.

### Subscription Limits
Enforced at the service layer before every invite — the member count is checked against the plan limit and returns a `403` if exceeded. No payment integration required — the plan is updated directly via the API.

---

## Trade-offs

| Decision | Trade-off |
|---|---|
| In-memory WebSocket registry | Fast and simple, but doesn't scale horizontally without Redis |
| Access token in WS query param | Simpler than custom headers, but token appears in server logs |
| Single org per user | Simpler architecture, but users can't belong to multiple orgs |
| No email service | Invite tokens are returned in API response instead of sent via email |

---

## Swagger Documentation

Full interactive API documentation available at:

```
http://localhost:3000/docs
```

Click **Authorize**, paste your Bearer token from the login response, and test all endpoints directly from the UI.

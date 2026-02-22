# Multi-Tenant SaaS API

A production-ready multi-tenant, subscription-based SaaS backend with real-time WebSocket notifications built with **Bun**, **Hono**, **Drizzle ORM**, and **PostgreSQL**.

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

# 3. Update .env with your secrets

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

## Swagger API Documentation

This project includes full interactive API documentation powered by **Swagger UI** and **OpenAPI 3.0**.

### Accessing the Docs

Once the server is running, open your browser and go to:

```
http://localhost:3000/docs
```

The raw OpenAPI JSON spec is also available at:

```
http://localhost:3000/docs/spec
```

### How to Authenticate in Swagger

Most endpoints require a Bearer token. Here's how to authenticate directly in the Swagger UI:

**Step 1** — Expand `POST /api/auth/login`, click **Try it out**, fill in your email and password, and click **Execute**.

**Step 2** — Copy the `accessToken` from the response body.

**Step 3** — Click the **Authorize** 🔒 button at the top of the page.

**Step 4** — In the value field type `Bearer ` followed by your token:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 5** — Click **Authorize** then **Close**. All protected endpoints will now automatically send your token.

### What's Documented

| Tag | Endpoints |
|---|---|
| Auth | Register, Login, Refresh, Logout |
| Organisations | Get org, Upgrade plan, Broadcast |
| Users | List, Invite, Accept invite, Remove |
| Activity | Activity feed |
| WebSocket | WS connection details |

### Notes

- Endpoints marked with 🔒 require authentication
- Endpoints marked with **Admin only** will return `403` if called by a Member
- The `/ws` WebSocket endpoint is documented for reference only — it cannot be tested via Swagger (use the HTML tester below)
- Rate limit headers are visible in every response under **Response headers** in Swagger UI:
  - `ratelimit-limit` — max requests allowed
  - `ratelimit-remaining` — requests left in the current window
  - `ratelimit-reset` — seconds until the window resets

---

## WebSocket Events

Connect with a valid access token as a query parameter. Events are broadcast to all connected members in the same organisation.

### Event Types

```json
{ "type": "USER_JOINED",       "payload": { "userId": "...", "name": "...", "email": "...", "role": "..." } }
{ "type": "PLAN_UPGRADED",     "payload": { "from": "FREE", "to": "PRO", "upgradedAt": "..." } }
{ "type": "BROADCAST_MESSAGE", "payload": { "message": "...", "sentBy": "...", "sentAt": "..." } }
{ "type": "USER_REMOVED",      "payload": { "userId": "...", "removedBy": "..." } }
```

### WebSocket Testing

Save the following as a `.html` file, open it in your browser, paste a fresh access token and click Connect:

```html
<!DOCTYPE html>
<html>
<head><title>WS Tester</title></head>
<body>
  <h3>WebSocket Tester</h3>
  <input id="token" placeholder="Paste access token here" style="width:500px" />
  <button onclick="connect()">Connect</button>
  <button onclick="ws && ws.close()">Disconnect</button>
  <pre id="log" style="background:#111;color:#0f0;padding:16px;margin-top:12px;height:400px;overflow-y:auto"></pre>

  <script>
    let ws
    const log = (msg) => {
      document.getElementById("log").textContent += msg + "\n"
    }
    function connect() {
      const token = document.getElementById("token").value
      ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`)
      ws.onopen = () => log("✅ Connected")
      ws.onmessage = (e) => log("📨 " + e.data)
      ws.onclose = () => log("❌ Disconnected")
      ws.onerror = () => log("🔴 Error")
    }
  </script>
</body>
</html>
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

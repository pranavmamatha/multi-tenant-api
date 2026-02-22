import { Hono } from "hono"
import { errorHandler } from "./middleware/errorHandler"
import authRouter from "./modules/auth/auth.routes"
import orgRouter from "./modules/organisations/org.routes"
import userRouter from "./modules/users/user.routes"
import activityRouter from "./modules/activity/activity.routes"
import { env } from "./config/env"
import { verifyAccessToken } from "./utils/jwt"
import { wsManager, WsData } from "./websocket/wsManager"
import { logger } from "hono/logger"
import { rateLimiter } from "hono-rate-limiter"

const app = new Hono()

// ─────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────

// request logging
app.use("*", logger())

// rate limiting — 100 requests per minute per IP
app.use("*", rateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  limit: 100,
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
  message: { success: false, message: "Too many requests, please slow down", data: null }
}))

// stricter limit on auth routes — 10 requests per minute
app.use("/api/auth/*", rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
  message: { success: false, message: "Too many auth attempts, please try again later", data: null }
}))

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok" }))
app.route("/api/auth", authRouter)
app.route("/api/organisations", orgRouter)
app.route("/api/users", userRouter)
app.route("/api/activities", activityRouter)

// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────

app.onError(errorHandler)

// ─────────────────────────────────────────
// START SERVER WITH WEBSOCKET
// ─────────────────────────────────────────
export default {
  port: env.port ?? 3000,

  fetch(req: Request, server: any) {
    const url = new URL(req.url)

    if (url.pathname === "/ws") {
      const token = url.searchParams.get("token")

      if (!token) {
        return new Response("Missing token", { status: 401 })
      }

      try {
        const payload = verifyAccessToken(token)
        const success = server.upgrade(req, {
          data: {
            userId: payload.userId,
            organisationId: payload.organisationId,
            role: payload.role
          } satisfies WsData
        })

        if (success) return undefined as any
        return new Response("WebSocket upgrade failed", { status: 500 })
      } catch {
        // no console.error — just return clean 401
        return new Response("Invalid or expired token", { status: 401 })
      }
    }

    return app.fetch(req)
  },

  websocket: {
    open(ws: any) {
      const { organisationId } = ws.data as WsData
      wsManager.join(organisationId, ws)
      ws.send(JSON.stringify({
        type: "CONNECTED",
        payload: { message: "Connected to real-time channel" }
      }))
    },

    message(ws: any, message: string) {
      try {
        const data = JSON.parse(message)
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }))
        }
      } catch {
        // ignore malformed messages
      }
    },

    close(ws: any) {
      const { organisationId, userId } = ws.data as WsData
      wsManager.leave(organisationId, ws)
      console.log(`WS: user ${userId} disconnected from org ${organisationId}`)
    }
  }
}

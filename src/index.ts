import { Hono } from "hono"
import { errorHandler } from "./middleware/errorHandler"
import authRouter from "./modules/auth/auth.routes"
import orgRouter from "./modules/organisations/org.routes"
import userRouter from "./modules/users/user.routes"
import { env } from "./config/env"
import activityRouter from "./modules/activity/activity.routes"

const app = new Hono()

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
// START SERVER
// ─────────────────────────────────────────

export default {
  port: env.port ?? 3000,
  fetch: app.fetch
}

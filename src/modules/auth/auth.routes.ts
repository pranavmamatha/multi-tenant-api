import { Hono } from "hono"
import { register, login, refresh, logout } from "./auth.controller"
import { authMiddleware } from "../../middleware/auth"

const authRouter = new Hono()

authRouter.post("/register", register)
authRouter.post("/login", login)
authRouter.post("/refresh", refresh)
authRouter.post("/logout", authMiddleware, logout)

export default authRouter

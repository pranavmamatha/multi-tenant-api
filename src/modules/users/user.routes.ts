import { Hono } from "hono"
import { authMiddleware } from "../../middleware/auth"
import { requireRole } from "../../middleware/role"
import { getUsers, inviteUser, acceptInvite, removeUser } from "./user.controller"

const userRouter = new Hono()

// public route — no auth needed
userRouter.post("/accept-invite", acceptInvite)

// protected routes
userRouter.use("*", authMiddleware)
userRouter.get("/", requireRole("ADMIN"), getUsers)
userRouter.post("/invite", requireRole("ADMIN"), inviteUser)
userRouter.delete("/:id", requireRole("ADMIN"), removeUser)

export default userRouter

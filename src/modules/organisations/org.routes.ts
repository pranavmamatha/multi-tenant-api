import { Hono } from "hono"
import { authMiddleware } from "../../middleware/auth"
import { requireRole } from "../../middleware/role"
import { getOrg, upgradePlan, broadcast } from "./org.controller"

const orgRouter = new Hono()

orgRouter.use("*", authMiddleware)

orgRouter.get("/", getOrg)
orgRouter.patch("/subscription", requireRole("ADMIN"), upgradePlan)
orgRouter.post("/broadcast", requireRole("ADMIN"), broadcast)

export default orgRouter

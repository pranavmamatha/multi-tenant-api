import { Hono } from "hono"
import { authMiddleware } from "../../middleware/auth"
import { getActivities } from "./activity.controller"

const activityRouter = new Hono()

activityRouter.use("*", authMiddleware)
activityRouter.get("/", getActivities)

export default activityRouter

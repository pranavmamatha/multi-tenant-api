import { Context, Next } from "hono"
import { ApiError } from "../config/ApiError"
import { verifyAccessToken } from "../config/jwt"
import { AppVariables } from "../types/hono"

export const authMiddleware = async (c: Context<{ Variables: AppVariables }>, next: Next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No token provided")
  }

  const token = authHeader.split(" ")[1]
  const payload = verifyAccessToken(token)

  c.set("userId", payload.userId)
  c.set("organisationId", payload.organisationId)
  c.set("role", payload.role)

  await next()
}

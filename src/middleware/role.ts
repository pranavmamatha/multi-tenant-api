import { Context, Next } from "hono"
import { ApiError } from "../config/ApiError"
import { Role } from "../generated/prisma/client"
import { AppVariables } from "../types/hono"

export const requireRole = (...roles: Role[]) => {
  return async (c: Context<{ Variables: AppVariables }>, next: Next) => {
    const role = c.get("role") as Role

    if (!roles.includes(role)) {
      throw new ApiError(403, "You do not have permission to perform this action")
    }

    await next()
  }
}

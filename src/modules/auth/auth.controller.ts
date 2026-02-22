import { Context } from "hono"
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema"
import { registerService, loginService, refreshTokenService, logoutService } from "./auth.service"
import { sendSuccess, sendError } from "../../utils/response"

export const register = async (c: Context) => {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await registerService(parsed.data)
  return sendSuccess(c, "Registration successful", result, 201)
}

export const login = async (c: Context) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await loginService(parsed.data)
  return sendSuccess(c, "Login successful", result)
}

export const refresh = async (c: Context) => {
  const body = await c.req.json()
  const parsed = refreshSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await refreshTokenService(parsed.data.refreshToken)
  return sendSuccess(c, "Token refreshed", result)
}

export const logout = async (c: Context) => {
  let refreshToken: string | undefined
  try {
    const body = await c.req.json()
    refreshToken = body.refreshToken
  } catch {
    // body was empty or not valid json
  }
  if (!refreshToken) {
    return sendError(c, "Refresh token is required", 400)
  }

  await logoutService(refreshToken)
  return sendSuccess(c, "Logged out successfully", null)
}

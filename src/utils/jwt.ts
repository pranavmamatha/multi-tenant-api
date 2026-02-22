import * as jwt from "jsonwebtoken"
import { env } from "../config/env"
import type { StringValue } from "ms"
import { ApiError } from "./ApiError"

type Role = "ADMIN" | "MEMBER"

export type JwtPayload = {
  userId: string
  organisationId: string
  role: Role
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtAccessSecret!, {
    expiresIn: env.jwtAccessExpiresIn as StringValue
  })
}

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtRefreshSecret!, {
    expiresIn: env.jwtRefreshExpiresIn as StringValue
  })
}

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret!) as JwtPayload
    return decoded
  } catch {
    throw new ApiError(401, "Invalid or expired access token")
  }
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret!) as JwtPayload
    return decoded
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token")
  }
}



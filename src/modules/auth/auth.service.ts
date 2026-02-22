import { eq } from "drizzle-orm"
import { db } from "../../db/index"
import { users, organisations, refreshTokens } from "../../db/schema"
import * as bcrypt from "bcryptjs"
import { ApiError } from "../../utils/ApiError"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt"
import { RegisterInput, LoginInput } from "./auth.schema"

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────

export const registerService = async (input: RegisterInput) => {
  const { name, email, password, organisationName } = input

  // check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (existingUser) {
    throw new ApiError(409, "Email already in use")
  }

  // hash the password
  const passwordHash = await bcrypt.hash(password, 10)

  // generate unique slug
  const baseSlug = generateSlug(organisationName)
  let slug = baseSlug
  let count = 1

  while (await db.query.organisations.findFirst({ where: eq(organisations.slug, slug) })) {
    slug = `${baseSlug}-${count}`
    count++
  }

  // create organisation and user in one transaction
  const result = await db.transaction(async (tx) => {
    const [organisation] = await tx.insert(organisations).values({
      name: organisationName,
      slug
    }).returning()

    const [user] = await tx.insert(users).values({
      name,
      email,
      passwordHash,
      role: "ADMIN",
      organisationId: organisation.id
    }).returning()

    return { organisation, user }
  })

  // generate tokens
  const accessToken = generateAccessToken({
    userId: result.user.id,
    organisationId: result.organisation.id,
    role: result.user.role
  })

  const refreshToken = generateRefreshToken({
    userId: result.user.id,
    organisationId: result.organisation.id,
    role: result.user.role
  })

  // store refresh token
  await db.insert(refreshTokens).values({
    token: refreshToken,
    userId: result.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role
    },
    organisation: {
      id: result.organisation.id,
      name: result.organisation.name,
      slug: result.organisation.slug
    }
  }
}

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

export const loginService = async (input: LoginInput) => {
  const { email, password } = input

  // find user with organisation
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: { organisation: true }
  })

  if (!user) {
    throw new ApiError(401, "Invalid email or password")
  }

  // verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password")
  }

  // generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    organisationId: user.organisationId,
    role: user.role
  })

  const refreshToken = generateRefreshToken({
    userId: user.id,
    organisationId: user.organisationId,
    role: user.role
  })

  // store refresh token
  await db.insert(refreshTokens).values({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    organisation: {
      id: user.organisation.id,
      name: user.organisation.name,
      slug: user.organisation.slug,
      subscriptionPlan: user.organisation.subscriptionPlan
    }
  }
}

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────

export const refreshTokenService = async (token: string) => {
  // verify jwt signature
  const payload = verifyRefreshToken(token)

  // check it exists in db
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
    with: { user: true }
  })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token")
  }

  // rotate — delete old, create new
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token))

  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    organisationId: payload.organisationId,
    role: payload.role
  })

  const newRefreshToken = generateRefreshToken({
    userId: payload.userId,
    organisationId: payload.organisationId,
    role: payload.role
  })

  await db.insert(refreshTokens).values({
    token: newRefreshToken,
    userId: storedToken.userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

export const logoutService = async (token: string) => {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
}

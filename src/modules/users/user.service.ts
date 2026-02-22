import { eq, and, count } from "drizzle-orm"
import { db } from "../../db/index"
import { users, invites, activities, organisations } from "../../db/schema"
import { ApiError } from "../../utils/ApiError"
import * as bcrypt from "bcryptjs"
import { PLAN_LIMITS } from "../organisations/org.service"
import { InviteUserInput, AcceptInviteInput } from "./user.schema"

// ─────────────────────────────────────────
// GET ALL USERS IN ORG
// ─────────────────────────────────────────

export const getUsersService = async (organisationId: string) => {
  return await db.query.users.findMany({
    where: eq(users.organisationId, organisationId),
    columns: {
      passwordHash: false  // never return password
    }
  })
}

// ─────────────────────────────────────────
// INVITE USER
// ─────────────────────────────────────────

export const inviteUserService = async (
  organisationId: string,
  actorId: string,
  input: InviteUserInput
) => {
  // get org with current member count
  const org = await db.query.organisations.findFirst({
    where: eq(organisations.id, organisationId)
  })

  if (!org) throw new ApiError(404, "Organisation not found")

  // check subscription limit
  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.organisationId, organisationId))

  const limit = PLAN_LIMITS[org.subscriptionPlan]
  if (memberCount >= limit) {
    throw new ApiError(403, `Member limit reached for ${org.subscriptionPlan} plan. Please upgrade.`)
  }

  // check if user already exists in org
  const existingUser = await db.query.users.findFirst({
    where: and(
      eq(users.email, input.email),
      eq(users.organisationId, organisationId)
    )
  })

  if (existingUser) {
    throw new ApiError(409, "User already exists in this organisation")
  }

  // check if invite already sent
  const existingInvite = await db.query.invites.findFirst({
    where: and(
      eq(invites.email, input.email),
      eq(invites.organisationId, organisationId),
      eq(invites.accepted, false)
    )
  })

  if (existingInvite) {
    throw new ApiError(409, "Invite already sent to this email")
  }

  // create invite with 24 hour expiry
  const [invite] = await db.insert(invites).values({
    email: input.email,
    organisationId,
    role: input.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }).returning()

  // log activity
  await db.insert(activities).values({
    organisationId,
    actorId,
    type: "INVITE_SENT",
    metadata: { invitedEmail: input.email, role: input.role }
  })

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,   // in production this would be sent via email
    expiresAt: invite.expiresAt
  }
}

// ─────────────────────────────────────────
// ACCEPT INVITE
// ─────────────────────────────────────────

export const acceptInviteService = async (input: AcceptInviteInput) => {
  // find valid invite
  const invite = await db.query.invites.findFirst({
    where: and(
      eq(invites.token, input.token),
      eq(invites.accepted, false)
    )
  })

  if (!invite) throw new ApiError(404, "Invalid or already used invite token")
  if (invite.expiresAt < new Date()) throw new ApiError(410, "Invite has expired")

  // check if email already has an account
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, invite.email)
  })

  if (existingUser) throw new ApiError(409, "An account with this email already exists")

  const passwordHash = await bcrypt.hash(input.password, 10)

  // create user and mark invite as accepted in one transaction
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      name: input.name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      organisationId: invite.organisationId
    }).returning()

    await tx.update(invites)
      .set({ accepted: true })
      .where(eq(invites.id, invite.id))

    return user
  })

  // log activity
  await db.insert(activities).values({
    organisationId: invite.organisationId,
    actorId: result.id,
    targetId: result.id,
    type: "USER_JOINED",
    metadata: { role: result.role }
  })

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role,
    organisationId: result.organisationId
  }
}

// ─────────────────────────────────────────
// REMOVE USER
// ─────────────────────────────────────────
export const removeUserService = async (
  organisationId: string,
  actorId: string,
  targetUserId: string
) => {
  if (actorId === targetUserId) {
    throw new ApiError(400, "You cannot remove yourself from the organisation")
  }

  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, targetUserId),
      eq(users.organisationId, organisationId)
    )
  })

  if (!user) throw new ApiError(404, "User not found in this organisation")

  if (user.role === "ADMIN") {
    throw new ApiError(403, "You cannot remove an admin from the organisation")
  }

  // 1️⃣ activity FIRST
  await db.insert(activities).values({
    organisationId,
    actorId,
    targetId: targetUserId,
    type: "USER_REMOVED",
    metadata: { removedEmail: user.email }
  })

  // 2️⃣ delete SECOND
  await db.delete(users).where(eq(users.id, targetUserId))

  return { removed: true }
}

import { eq } from "drizzle-orm"
import { db } from "../../db/index"
import { organisations, activities } from "../../db/schema"
import { ApiError } from "../../utils/ApiError"
import { UpgradePlanInput } from "./org.schema"
import { wsManager } from "../../websocket/wsManager"
// ─────────────────────────────────────────
// PLAN LIMITS
// ─────────────────────────────────────────

export const PLAN_LIMITS: Record<string, number> = {
  FREE: 3,
  PRO: 10,
  ENTERPRISE: Infinity
}

// ─────────────────────────────────────────
// GET ORGANISATION
// ─────────────────────────────────────────

export const getOrgService = async (organisationId: string) => {
  const org = await db.query.organisations.findFirst({
    where: eq(organisations.id, organisationId),
    with: { users: true }
  })

  if (!org) throw new ApiError(404, "Organisation not found")

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    subscriptionPlan: org.subscriptionPlan,
    memberCount: org.users.length,
    memberLimit: PLAN_LIMITS[org.subscriptionPlan],
    createdAt: org.createdAt
  }
}

// ─────────────────────────────────────────
// UPGRADE PLAN
// ─────────────────────────────────────────

export const upgradePlanService = async (
  organisationId: string,
  actorId: string,
  input: UpgradePlanInput
) => {
  const org = await db.query.organisations.findFirst({
    where: eq(organisations.id, organisationId)
  })

  if (!org) throw new ApiError(404, "Organisation not found")
  if (org.subscriptionPlan === input.plan) {
    throw new ApiError(400, `Organisation is already on the ${input.plan} plan`)
  }

  const [updated] = await db
    .update(organisations)
    .set({ subscriptionPlan: input.plan, updatedAt: new Date() })
    .where(eq(organisations.id, organisationId))
    .returning()

  wsManager.broadcast(organisationId, {
    type: "PLAN_UPGRADED",
    payload: {
      from: org.subscriptionPlan,
      to: input.plan,
      upgradedAt: new Date().toISOString()
    }
  })
  // log activity
  await db.insert(activities).values({
    organisationId,
    actorId,
    type: "PLAN_UPGRADED",
    metadata: { from: org.subscriptionPlan, to: input.plan }
  })

  return updated
}

// ─────────────────────────────────────────
// BROADCAST MESSAGE
// ─────────────────────────────────────────

export const broadcastService = async (
  organisationId: string,
  actorId: string,
  message: string
) => {
  const activity = await db.insert(activities).values({
    organisationId,
    actorId,
    type: "BROADCAST_MESSAGE",
    message
  }).returning()

  wsManager.broadcast(organisationId, {
    type: "BROADCAST_MESSAGE",
    payload: {
      message,
      sentBy: actorId,
      sentAt: new Date().toISOString()
    }
  })

  return activity[0]
}

import { Context } from "hono"
import { sendSuccess, sendError } from "../../utils/response"
import { getOrgService, upgradePlanService, broadcastService } from "./org.service"
import { upgradePlanSchema, broadcastSchema } from "./org.schema"

export const getOrg = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const result = await getOrgService(organisationId)
  return sendSuccess(c, "Organisation fetched", result)
}

export const upgradePlan = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const actorId = c.get("userId")
  const body = await c.req.json()
  const parsed = upgradePlanSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await upgradePlanService(organisationId, actorId, parsed.data)
  return sendSuccess(c, "Subscription plan upgraded", result)
}

export const broadcast = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const actorId = c.get("userId")
  const body = await c.req.json()
  const parsed = broadcastSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await broadcastService(organisationId, actorId, parsed.data.message)
  return sendSuccess(c, "Message broadcasted", result, 201)
}

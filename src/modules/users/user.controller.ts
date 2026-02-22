import { Context } from "hono"
import { sendSuccess, sendError } from "../../utils/response"
import { inviteUserSchema, acceptInviteSchema } from "./user.schema"
import {
  getUsersService,
  inviteUserService,
  acceptInviteService,
  removeUserService
} from "./user.service"

export const getUsers = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const result = await getUsersService(organisationId)
  return sendSuccess(c, "Users fetched", result)
}

export const inviteUser = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const actorId = c.get("userId")
  const body = await c.req.json()
  const parsed = inviteUserSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await inviteUserService(organisationId, actorId, parsed.data)
  return sendSuccess(c, "Invite sent successfully", result, 201)
}

export const acceptInvite = async (c: Context) => {
  const body = await c.req.json()
  const parsed = acceptInviteSchema.safeParse(body)

  if (!parsed.success) {
    return sendError(c, parsed.error.issues[0].message, 422)
  }

  const result = await acceptInviteService(parsed.data)
  return sendSuccess(c, "Invite accepted successfully", result, 201)
}

export const removeUser = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const actorId = c.get("userId")
  const targetUserId = c.req.param("id")

  const result = await removeUserService(organisationId, actorId, targetUserId)
  return sendSuccess(c, "User removed successfully", result)
}

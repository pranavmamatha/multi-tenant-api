import { Context } from "hono"
import { sendSuccess } from "../../utils/response"
import { getActivitiesService } from "./activity.service"

export const getActivities = async (c: Context) => {
  const organisationId = c.get("organisationId")
  const result = await getActivitiesService(organisationId)
  return sendSuccess(c, "Activities fetched", result)
}

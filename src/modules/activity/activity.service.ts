import { eq, desc } from "drizzle-orm"
import { db } from "../../db/index"
import { activities } from "../../db/schema"

export const getActivitiesService = async (organisationId: string) => {
  return await db.query.activities.findMany({
    where: eq(activities.organisationId, organisationId),
    orderBy: desc(activities.createdAt),
    with: {
      actor: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      target: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

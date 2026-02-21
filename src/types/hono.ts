import { Role } from "../generated/prisma/client"

export type AppVariables = {
  userId: string
  organisationId: string
  role: Role
}

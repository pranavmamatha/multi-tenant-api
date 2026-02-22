type Role = "ADMIN" | "MEMBER"

export type AppVariables = {
  userId: string
  organisationId: string
  role: Role
}

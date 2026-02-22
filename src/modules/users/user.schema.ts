import { z } from "zod"

export const inviteUserSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>

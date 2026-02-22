import { z } from "zod"

export const upgradePlanSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"])
})

export const broadcastSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
})

export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>
export type BroadcastInput = z.infer<typeof broadcastSchema>

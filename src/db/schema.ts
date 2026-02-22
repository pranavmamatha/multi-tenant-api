import { pgTable, pgEnum, text, timestamp, boolean, json } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export const roleEnum = pgEnum("role", ["ADMIN", "MEMBER"])
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["FREE", "PRO", "ENTERPRISE"])
export const activityTypeEnum = pgEnum("activity_type", [
  "USER_JOINED",
  "USER_REMOVED",
  "USER_ROLE_CHANGED",
  "PLAN_UPGRADED",
  "PLAN_DOWNGRADED",
  "INVITE_SENT",
  "INVITE_ACCEPTED",
  "INVITE_REVOKED",
  "BROADCAST_MESSAGE"
])

// ─────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("FREE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("MEMBER"),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
})

export const invites = pgTable("invites", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("MEMBER"),
  token: text("token").notNull().unique().$defaultFn(() => createId()),
  expiresAt: timestamp("expires_at").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
})

export const activities = pgTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  targetId: text("target_id").references(() => users.id, { onDelete: "set null" }),
  type: activityTypeEnum("type").notNull(),
  message: text("message"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
})

// ─────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────

export const organisationRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  invites: many(invites),
  activities: many(activities)
}))

export const userRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id]
  }),
  refreshTokens: many(refreshTokens),
  actionsPerformed: many(activities, { relationName: "actorActivities" }),
  actionsReceived: many(activities, { relationName: "targetActivities" })
}))

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id]
  })
}))

export const inviteRelations = relations(invites, ({ one }) => ({
  organisation: one(organisations, {
    fields: [invites.organisationId],
    references: [organisations.id]
  })
}))

export const activityRelations = relations(activities, ({ one }) => ({
  organisation: one(organisations, {
    fields: [activities.organisationId],
    references: [organisations.id]
  }),
  actor: one(users, {
    fields: [activities.actorId],
    references: [users.id],
    relationName: "actorActivities"
  }),
  target: one(users, {
    fields: [activities.targetId],
    references: [users.id],
    relationName: "targetActivities"
  })
}))

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type Organisation = typeof organisations.$inferSelect
export type NewOrganisation = typeof organisations.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type Invite = typeof invites.$inferSelect
export type Activity = typeof activities.$inferSelect

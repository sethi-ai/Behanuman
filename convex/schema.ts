import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  authVerifiers: authTables.authVerifiers.index("by_sessionId", ["sessionId"]),
  accountDeletions: defineTable({ userId: v.id("users") }).index("by_userId", ["userId"]),
  practice: defineTable({
    userId: v.id("users"), snapshot: v.record(v.string(), v.string()), revision: v.number(), updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
  practiceImports: defineTable({ userId: v.id("users"), deviceId: v.string() }).index("by_userId_and_deviceId", ["userId", "deviceId"]),
  roundEvents: defineTable({ userId: v.id("users"), eventId: v.string(), date: v.string() }).index("by_userId_and_eventId", ["userId", "eventId"]),
  activeDays: defineTable({ userId: v.id("users"), date: v.string() }).index("by_userId_and_date", ["userId", "date"]),
  dailyMetrics: defineTable({ date: v.string(), newUsers: v.number(), activeUsers: v.number(), rounds: v.number() }).index("by_date", ["date"]),
});

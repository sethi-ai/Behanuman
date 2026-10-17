import {launchTotalsValidator} from './launchValidators';
import { learningValidator } from './learningValidators';
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  hiQuotaConfig:defineTable({key:v.literal('test-rollout-2026-10'),startedAt:v.number(),priorReservedCents:v.literal(0)}).index('by_key',['key']),
  hiUserQuotas:defineTable({userId:v.id('users'),used:v.number(),activeRequestId:v.optional(v.string()),activeUntil:v.optional(v.number())}).index('by_userId',['userId']),
  hiReflectionRequests:defineTable({userId:v.id('users'),requestId:v.string(),admittedAt:v.number()}).index('by_user_request',['userId','requestId']),
  hiBudget:defineTable({key:v.literal('test-rollout-2026-10'),reservedCents:v.number()}).index('by_key',['key']),
  launchConfig:defineTable({key:v.literal('main'),startedAt:v.number(),qaUserIds:v.array(v.id('users'))}).index('by_key',['key']),
  launchTotals:defineTable({launchId:v.id('launchConfig'),qa:v.boolean(),counts:launchTotalsValidator}).index('by_launch_and_qa',['launchId','qa']),
  launchPeople:defineTable({launchId:v.id('launchConfig'),userId:v.id('users'),qa:v.boolean(),meaningful:v.boolean(),emailBackedFirstUse:v.optional(v.boolean()),newAccountFirstUse:v.optional(v.boolean()),firstSeenAt:v.number(),lastSeenAt:v.number()}).index('by_launch_user_qa',['launchId','userId','qa']).index('by_userId',['userId']),
  launchEvents:defineTable({launchId:v.id('launchConfig'),userId:v.id('users'),eventId:v.string(),kind:v.union(v.literal('login'),v.literal('round'),v.literal('learn')),qa:v.boolean(),occurredAt:v.number(),receivedAt:v.number()}).index('by_launch_user_event',['launchId','userId','eventId']).index('by_userId',['userId']),
  launchGuests:defineTable({launchId:v.id('launchConfig'),deviceId:v.string(),qa:v.boolean(),firstSeenAt:v.number(),userId:v.optional(v.id('users'))}).index('by_launch_and_device',['launchId','deviceId']).index('by_userId',['userId']),
  onboardingCompletions: defineTable({eventId:v.string(),path:v.literal("phone_flow"),timestamp:v.number(),test:v.boolean()}).index("by_eventId",["eventId"]),
  onboardingDailyMetrics: defineTable({date:v.string(),test:v.boolean(),phoneFlowCompletions:v.number()}).index("by_date_and_test",["date","test"]),
  learningProgress: defineTable({userId:v.id("users"),state:learningValidator}).index("by_userId",["userId"]),
  learningImports: defineTable({userId:v.id("users"),deviceId:v.string()}).index("by_userId_and_deviceId",["userId","deviceId"]),
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

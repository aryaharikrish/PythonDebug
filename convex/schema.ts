import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_token", ["tokenIdentifier"]),

  debuggingSessions: defineTable({
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    errorType: v.string(),
    errorMessage: v.string(),
    errorLine: v.optional(v.number()),
    explanation: v.string(),
    suggestedFix: v.string(),
    correctedCode: v.string(),
    status: v.union(v.literal("error"), v.literal("success")),
    numberOfErrors: v.number(),
    executionTime: v.number(),
    timestamp: v.number(),
    fixed: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  challenges: defineTable({
    title: v.string(),
    category: v.string(), // "Syntax Errors", "Index Errors", "Type Errors", etc.
    categorySlug: v.string(),
    difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
    description: v.string(),
    buggyCode: v.string(),
    expectedOutput: v.string(),
    hint: v.string(),
    solutionExplanation: v.string(),
    solutionCode: v.string(),
    order: v.number(),
  }).index("by_category", ["categorySlug"]),

  submissions: defineTable({
    userId: v.string(),
    challengeId: v.string(),
    code: v.string(),
    passed: v.boolean(),
    errorMessage: v.optional(v.string()),
    executionTime: v.number(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_challenge", ["userId", "challengeId"]),

  userProgress: defineTable({
    userId: v.string(),
    solvedChallengeIds: v.array(v.string()),
    totalAttempts: v.number(),
    successfulFixes: v.number(),
    errorCounts: v.any(), // JSON object mapping error types to counts
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  errorPatterns: defineTable({
    errorType: v.string(),
    title: v.string(),
    description: v.string(),
    commonCauses: v.array(v.string()),
    exampleBuggyCode: v.string(),
    exampleFixedCode: v.string(),
  }).index("by_type", ["errorType"]),
});

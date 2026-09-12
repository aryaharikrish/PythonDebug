import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new debugging session record
export const createSession = mutation({
  args: {
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
    fixed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("debuggingSessions", {
      ...args,
      timestamp: Date.now(),
    });
    return sessionId;
  },
});

// Fetch all debugging sessions for a given user
export const getUserSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("debuggingSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return sessions;
  },
});

// Mark session as fixed
export const markSessionFixed = mutation({
  args: { sessionId: v.id("debuggingSessions"), fixed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      fixed: args.fixed,
    });
  },
});

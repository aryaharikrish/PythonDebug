import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user progress stats
export const getUserProgress = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) {
      return {
        userId: args.userId,
        solvedChallengeIds: [],
        totalAttempts: 0,
        successfulFixes: 0,
        errorCounts: {},
        updatedAt: Date.now(),
      };
    }
    return progress;
  },
});

// Update error count statistics
export const logErrorType = mutation({
  args: { userId: v.string(), errorType: v.string() },
  handler: async (ctx, args) => {
    let progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) {
      await ctx.db.insert("userProgress", {
        userId: args.userId,
        solvedChallengeIds: [],
        totalAttempts: 1,
        successfulFixes: 0,
        errorCounts: { [args.errorType]: 1 },
        updatedAt: Date.now(),
      });
    } else {
      const counts = progress.errorCounts || {};
      counts[args.errorType] = (counts[args.errorType] || 0) + 1;
      await ctx.db.patch(progress._id, {
        errorCounts: counts,
        totalAttempts: progress.totalAttempts + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

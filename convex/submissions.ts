import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new submission record for a challenge
export const submitChallenge = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
    code: v.string(),
    passed: v.boolean(),
    errorMessage: v.optional(v.string()),
    executionTime: v.number(),
  },
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("submissions", {
      ...args,
      timestamp: Date.now(),
    });

    // Update user progress if passed
    let progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) {
      progress = {
        userId: args.userId,
        solvedChallengeIds: args.passed ? [args.challengeId] : [],
        totalAttempts: 1,
        successfulFixes: args.passed ? 1 : 0,
        errorCounts: {},
        updatedAt: Date.now(),
      };
      await ctx.db.insert("userProgress", progress);
    } else {
      const solved = new Set(progress.solvedChallengeIds);
      if (args.passed) {
        solved.add(args.challengeId);
      }
      await ctx.db.patch(progress._id, {
        solvedChallengeIds: Array.from(solved),
        totalAttempts: progress.totalAttempts + 1,
        successfulFixes: args.passed ? progress.successfulFixes + 1 : progress.successfulFixes,
        updatedAt: Date.now(),
      });
    }

    return submissionId;
  },
});

// Fetch submissions by user
export const getUserSubmissions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

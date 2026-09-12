import { query } from "./_generated/server";
import { v } from "convex/values";

// Calculate student dashboard statistics
export const getDashboardStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("debuggingSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const totalChallenges = await ctx.db.query("challenges").collect();

    const totalAttempts = (progress?.totalAttempts || 0) + sessions.length;
    const solvedChallengeIds = progress?.solvedChallengeIds || [];
    const problemsSolved = solvedChallengeIds.length;
    const totalAvailable = totalChallenges.length || 10;
    const problemsRemaining = Math.max(0, totalAvailable - problemsSolved);

    const successfulSessions = sessions.filter((s) => s.status === "success" || s.fixed).length;
    const successRate = totalAttempts > 0 ? Math.round(((successfulSessions + problemsSolved) / (totalAttempts + 1)) * 100) : 0;

    // Aggregate error types
    const errorTypeMap: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.errorType && s.errorType !== "None") {
        errorTypeMap[s.errorType] = (errorTypeMap[s.errorType] || 0) + 1;
      }
    });

    return {
      totalDebuggingAttempts: totalAttempts,
      problemsSolved,
      problemsRemaining,
      successRate: Math.min(100, Math.max(0, successRate)),
      commonErrorTypes: Object.entries(errorTypeMap).map(([type, count]) => ({ type, count })),
      recentSessions: sessions.slice(0, 5),
      totalAvailableChallenges: totalAvailable,
    };
  },
});

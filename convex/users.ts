import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create or update user profile
export const storeUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatar: args.avatar,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      createdAt: Date.now(),
    });
  },
});

// Get user profile
export const getUser = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();
  },
});

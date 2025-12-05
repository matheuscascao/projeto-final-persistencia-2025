import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { ratings, touristSpots } from "../db/schema";
import { ratingCreateSchema } from "@tourism/shared";
import { authenticate } from "../middleware/auth";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const ratingsRouter = new Hono();

// Get ratings for a spot
ratingsRouter.get("/spot/:spotId", async (c) => {
  try {
    const { spotId } = c.req.param();
    
    const spotRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.spotId, spotId))
      .orderBy(sql`${ratings.createdAt} DESC`);

    return c.json(spotRatings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return c.json({ error: "Failed to fetch ratings" }, 500);
  }
});

// Get user's rating for a spot
ratingsRouter.get("/spot/:spotId/my-rating", authenticate, async (c) => {
  try {
    const { spotId } = c.req.param();
    const user = c.get("user");

    console.log("Fetching my-rating:", { spotId, userId: user.id });

    const [userRating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.spotId, spotId), eq(ratings.userId, user.id)))
      .limit(1);

    console.log("Found rating:", userRating ? "yes" : "no", userRating);

    if (!userRating) {
      return c.json(null); // Return null instead of 404 for "no rating yet"
    }

    return c.json(userRating);
  } catch (error) {
    console.error("Error fetching rating:", error);
    return c.json({ error: "Failed to fetch rating" }, 500);
  }
});

// Create or update rating (atomic average calculation)
ratingsRouter.post(
  "/spot/:spotId",
  authenticate,
  zValidator("json", z.object({
    score: z.number().int().min(1).max(5),
    summaryComment: z.string().min(1).max(500),
  })),
  async (c) => {
    try {
      const { spotId } = c.req.param();
      const { score, summaryComment } = c.req.valid("json");
      const user = c.get("user");

      // Check if spot exists
      const [spot] = await db
        .select()
        .from(touristSpots)
        .where(eq(touristSpots.id, spotId))
        .limit(1);

      if (!spot) {
        return c.json({ error: "Spot not found" }, 404);
      }

      // Check if user already rated this spot
      const [existingRating] = await db
        .select()
        .from(ratings)
        .where(and(eq(ratings.spotId, spotId), eq(ratings.userId, user.id)))
        .limit(1);

      let rating;

      if (existingRating) {
        // Update existing rating
        [rating] = await db
          .update(ratings)
          .set({
            score,
            summaryComment,
          })
          .where(eq(ratings.id, existingRating.id))
          .returning();
        
        if (!rating) {
          throw new Error("Failed to update rating");
        }
      } else {
        // Create new rating
        const insertResult = await db
          .insert(ratings)
          .values({
            spotId,
            userId: user.id,
            score,
            summaryComment,
          })
          .returning();
        
        if (!insertResult || insertResult.length === 0) {
          throw new Error("Failed to create rating - no data returned");
        }
        
        [rating] = insertResult;
        
        if (!rating) {
          throw new Error("Failed to create rating - rating is null");
        }
      }

      // Recalculate average rating atomically
      const [{ avg }] = await db
        .select({
          avg: sql<string>`AVG(${ratings.score})`,
        })
        .from(ratings)
        .where(eq(ratings.spotId, spotId));

      await db
        .update(touristSpots)
        .set({
          averageRating: avg || "0",
        })
        .where(eq(touristSpots.id, spotId));

      console.log("Rating saved:", { ratingId: rating.id, spotId, userId: user.id, score: rating.score });

      return c.json(rating, existingRating ? 200 : 201);
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      return c.json({ error: "Failed to save rating" }, 500);
    }
  }
);

// Delete rating
ratingsRouter.delete("/spot/:spotId", authenticate, async (c) => {
  try {
    const { spotId } = c.req.param();
    const user = c.get("user");

    const [existingRating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.spotId, spotId), eq(ratings.userId, user.id)))
      .limit(1);

    if (!existingRating) {
      return c.json({ error: "Rating not found" }, 404);
    }

    // Check permissions
    if (existingRating.userId !== user.id && user.role !== "ADMIN") {
      return c.json({ error: "Forbidden" }, 403);
    }

    await db.delete(ratings).where(eq(ratings.id, existingRating.id));

    // Recalculate average rating
    const [{ avg }] = await db
      .select({
        avg: sql<string>`AVG(${ratings.score})`,
      })
      .from(ratings)
      .where(eq(ratings.spotId, spotId));

    await db
      .update(touristSpots)
      .set({
        averageRating: avg || "0",
      })
      .where(eq(touristSpots.id, spotId));

    return c.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    return c.json({ error: "Failed to delete rating" }, 500);
  }
});

export default ratingsRouter;


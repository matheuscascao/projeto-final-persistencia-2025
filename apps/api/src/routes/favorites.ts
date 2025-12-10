import { Hono } from "hono";
import { db } from "../db/client";
import { favorites, touristSpots } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { eq, and, desc } from "drizzle-orm";

const app = new Hono();

// List user's favorites
app.get("/", authenticate, async (c) => {
    try {
        const user = c.get("user");

        const userFavorites = await db.query.favorites.findMany({
            where: eq(favorites.userId, user.id),
            with: {
                spot: true,
            },
            orderBy: desc(favorites.createdAt),
        });

        return c.json(userFavorites);
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return c.json({ error: "Failed to fetch favorites" }, 500);
    }
});

// Add a spot to favorites
app.post("/:spotId", authenticate, async (c) => {
    try {
        const { spotId } = c.req.param();
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

        // Check if already favorite
        const [existing] = await db
            .select()
            .from(favorites)
            .where(
                and(
                    eq(favorites.userId, user.id),
                    eq(favorites.spotId, spotId)
                )
            )
            .limit(1);

        if (existing) {
            return c.json({ message: "Spot is already in favorites" }, 409);
        }

        const [inserted] = await db
            .insert(favorites)
            .values({
                userId: user.id,
                spotId: spotId,
            })
            .returning();

        return c.json(inserted, 201);
    } catch (error) {
        console.error("Error adding favorite:", error);
        return c.json({ error: "Failed to add favorite" }, 500);
    }
});

// Remove a spot from favorites
app.delete("/:spotId", authenticate, async (c) => {
    try {
        const { spotId } = c.req.param();
        const user = c.get("user");

        const [deleted] = await db
            .delete(favorites)
            .where(
                and(
                    eq(favorites.userId, user.id),
                    eq(favorites.spotId, spotId)
                )
            )
            .returning();

        if (!deleted) {
            return c.json({ error: "Favorite not found" }, 404);
        }

        return c.json({ message: "Favorite removed successfully" });
    } catch (error) {
        console.error("Error removing favorite:", error);
        return c.json({ error: "Failed to remove favorite" }, 500);
    }
});

export default app;

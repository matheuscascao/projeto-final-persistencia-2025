import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { touristSpots } from "../db/schema";
import { TouristSpotCreateInput, touristSpotCreateSchema } from "@tourism/shared";
import { authenticate, requireRole } from "../middleware/auth";
import { eq, like, ilike, and, sql, or, desc } from "drizzle-orm"; // Add ilike to imports

// ...

// Recommendations Endpoint
spots.get("/recommendations", async (c) => {
  try {
    // Get top 5 spots by rating
    const topSpots = await db
      .select()
      .from(touristSpots)
      .orderBy(desc(touristSpots.averageRating))
      .limit(5);

    return c.json(topSpots);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return c.json({ error: "Failed to fetch recommendations" }, 500);
  }
});


const paginationSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minRating: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "rating", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Get all tourist spots with pagination and filters
spots.get("/", zValidator("query", paginationSchema), async (c) => {
  try {
    const {
      page,
      limit,
      city,
      state,
      country,
      minRating,
      search,
      sortBy,
      sortOrder,
    } = c.req.valid("query");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build filters
    const filters = [];
    if (city) filters.push(ilike(touristSpots.city, `%${city}%`));
    if (state) filters.push(ilike(touristSpots.state, `%${state}%`));
    if (country) filters.push(ilike(touristSpots.country, `%${country}%`));
    if (minRating) {
      filters.push(sql`${touristSpots.averageRating} >= ${minRating}`);
    }
    if (search) {
      filters.push(
        or(
          ilike(touristSpots.name, `%${search}%`),
          ilike(touristSpots.description, `%${search}%`)
        )!
      );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(touristSpots)
      .where(whereClause);

    // Get paginated results with sorting
    let query = db.select().from(touristSpots).where(whereClause);

    // Apply sorting
    if (sortBy === "name") {
      query = sortOrder === "asc"
        ? query.orderBy(touristSpots.name)
        : query.orderBy(desc(touristSpots.name));
    } else if (sortBy === "rating") {
      query = sortOrder === "asc"
        ? query.orderBy(touristSpots.averageRating)
        : query.orderBy(desc(touristSpots.averageRating));
    } else {
      query = sortOrder === "asc"
        ? query.orderBy(touristSpots.createdAt)
        : query.orderBy(desc(touristSpots.createdAt));
    }

    const allSpots = await query.limit(limitNum).offset(offset);

    return c.json({
      data: allSpots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching spots:", error);
    return c.json({ error: "Failed to fetch spots" }, 500);
  }
});

// Get single tourist spot by ID
spots.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const redis = await getRedisClient();
    const cacheKey = `spot:${id}`;

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Redis error:", err);
    }

    const [spot] = await db
      .select()
      .from(touristSpots)
      .where(eq(touristSpots.id, id))
      .limit(1);

    if (!spot) {
      return c.json({ error: "Spot not found" }, 404);
    }

    // Fetch weather (don't fail if weather fails)
    const weather = await getWeather(Number(spot.lat), Number(spot.lng));

    const result = { ...spot, weather };

    // Set cache (1 hour)
    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });
    } catch (err) {
      console.error("Redis set error:", err);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching spot:", error);
    return c.json({ error: "Failed to fetch spot" }, 500);
  }
});

// Create Tourist Spot (requires authentication)
spots.post(
  "/",
  authenticate,
  zValidator("json", touristSpotCreateSchema),
  async (c) => {
    try {
      const body = c.req.valid("json") as TouristSpotCreateInput;
      const user = c.get("user");

      const [inserted] = await db
        .insert(touristSpots)
        .values({
          name: body.name,
          description: body.description,
          city: body.city,
          state: body.state,
          country: body.country,
          address: body.address,
          lat: body.lat,
          lng: body.lng,
          createdBy: user.id,
        })
        .returning();

      return c.json(inserted, 201);
    } catch (error) {
      console.error("Error creating spot:", error);
      return c.json({ error: "Failed to create spot" }, 500);
    }
  }
);

// Update Tourist Spot (requires authentication and ownership or admin role)
spots.put(
  "/:id",
  authenticate,
  zValidator("json", touristSpotCreateSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = c.req.valid("json") as TouristSpotCreateInput;
      const user = c.get("user");

      // Check if spot exists
      const [existing] = await db
        .select()
        .from(touristSpots)
        .where(eq(touristSpots.id, id))
        .limit(1);

      if (!existing) {
        return c.json({ error: "Spot not found" }, 404);
      }

      // Check permissions (owner or admin)
      if (existing.createdBy !== user.id && user.role !== "ADMIN") {
        return c.json({ error: "Forbidden - You can only edit your own spots" }, 403);
      }

      const [updated] = await db
        .update(touristSpots)
        .set({
          name: body.name,
          description: body.description,
          city: body.city,
          state: body.state,
          country: body.country,
          address: body.address,
          lat: body.lat,
          lng: body.lng,
        })
        .where(eq(touristSpots.id, id))
        .returning();

      // Invalidate cache
      try {
        const redis = await getRedisClient();
        await redis.del(`spot:${id}`);
      } catch (err) {
        console.error("Redis del error:", err);
      }

      return c.json(updated);
    } catch (error) {
      console.error("Error updating spot:", error);
      return c.json({ error: "Failed to update spot" }, 500);
    }
  }
);

// Delete Tourist Spot (requires authentication and ownership or admin role)
spots.delete("/:id", authenticate, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");

    // Check if spot exists
    const [existing] = await db
      .select()
      .from(touristSpots)
      .where(eq(touristSpots.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Spot not found" }, 404);
    }

    // Check permissions (owner or admin)
    if (existing.createdBy !== user.id && user.role !== "ADMIN") {
      return c.json({ error: "Forbidden - You can only delete your own spots" }, 403);
    }

    await db.delete(touristSpots).where(eq(touristSpots.id, id));

    // Invalidate cache
    try {
      const redis = await getRedisClient();
      await redis.del(`spot:${id}`);
    } catch (err) {
      console.error("Redis del error:", err);
    }

    return c.json({ message: "Spot deleted successfully" });
  } catch (error) {
    console.error("Error deleting spot:", error);
    return c.json({ error: "Failed to delete spot" }, 500);
  }
});

export default spots;



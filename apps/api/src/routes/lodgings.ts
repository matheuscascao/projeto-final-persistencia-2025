import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { lodgings } from "../db/schema";
import { lodgingCreateSchema, lodgingUpdateSchema } from "@tourism/shared";
import { authenticate, requireRole } from "../middleware/auth";
import { eq } from "drizzle-orm";

const lodgingsRouter = new Hono();

// Get lodgings for a spot
lodgingsRouter.get("/spot/:spotId", async (c) => {
  try {
    const { spotId } = c.req.param();
    
    const spotLodgings = await db
      .select()
      .from(lodgings)
      .where(eq(lodgings.spotId, spotId));

    return c.json(spotLodgings);
  } catch (error) {
    console.error("Error fetching lodgings:", error);
    return c.json({ error: "Failed to fetch lodgings" }, 500);
  }
});

// Get single lodging
lodgingsRouter.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    
    const [lodging] = await db
      .select()
      .from(lodgings)
      .where(eq(lodgings.id, id))
      .limit(1);

    if (!lodging) {
      return c.json({ error: "Lodging not found" }, 404);
    }

    return c.json(lodging);
  } catch (error) {
    console.error("Error fetching lodging:", error);
    return c.json({ error: "Failed to fetch lodging" }, 500);
  }
});

// Create lodging (requires authentication)
lodgingsRouter.post(
  "/",
  authenticate,
  zValidator("json", lodgingCreateSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");

      const [newLodging] = await db
        .insert(lodgings)
        .values(body)
        .returning();

      return c.json(newLodging, 201);
    } catch (error) {
      console.error("Error creating lodging:", error);
      return c.json({ error: "Failed to create lodging" }, 500);
    }
  }
);

// Update lodging (requires authentication)
lodgingsRouter.put(
  "/:id",
  authenticate,
  zValidator("json", lodgingUpdateSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = c.req.valid("json");

      const [updated] = await db
        .update(lodgings)
        .set(body)
        .where(eq(lodgings.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Lodging not found" }, 404);
      }

      return c.json(updated);
    } catch (error) {
      console.error("Error updating lodging:", error);
      return c.json({ error: "Failed to update lodging" }, 500);
    }
  }
);

// Delete lodging (requires authentication)
lodgingsRouter.delete("/:id", authenticate, async (c) => {
  try {
    const { id } = c.req.param();

    await db.delete(lodgings).where(eq(lodgings.id, id));

    return c.json({ message: "Lodging deleted successfully" });
  } catch (error) {
    console.error("Error deleting lodging:", error);
    return c.json({ error: "Failed to delete lodging" }, 500);
  }
});

export default lodgingsRouter;


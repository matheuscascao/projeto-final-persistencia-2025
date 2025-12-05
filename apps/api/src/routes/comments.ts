import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getMongoDb } from "../mongo/client";
import { commentCreateSchema, commentUpdateSchema } from "@tourism/shared";
import { authenticate } from "../middleware/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const comments = new Hono();

// Get comments for a spot
comments.get("/spot/:spotId", async (c) => {
  try {
    const { spotId } = c.req.param();
    const db = await getMongoDb();
    
    const spotComments = await db
      .collection("comments")
      .find({ spotId })
      .sort({ createdAt: -1 })
      .toArray();

    return c.json(spotComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return c.json({ error: "Failed to fetch comments" }, 500);
  }
});

// Create comment
comments.post(
  "/spot/:spotId",
  authenticate,
  zValidator("json", z.object({
    text: z.string().min(1).max(500),
    metadata: z.object({
      device: z.string().optional(),
      language: z.string().optional(),
    }).optional(),
  })),
  async (c) => {
    try {
      const { spotId } = c.req.param();
      const { text, metadata } = c.req.valid("json");
      const user = c.get("user");
      const db = await getMongoDb();

      const comment = {
        spotId,
        userId: user.id,
        text,
        metadata: metadata || {},
        replies: [],
        createdAt: new Date(),
      };

      const result = await db.collection("comments").insertOne(comment);

      return c.json({ ...comment, _id: result.insertedId }, 201);
    } catch (error) {
      console.error("Error creating comment:", error);
      return c.json({ error: "Failed to create comment" }, 500);
    }
  }
);

// Update comment
comments.put(
  "/:commentId",
  authenticate,
  zValidator("json", commentUpdateSchema),
  async (c) => {
    try {
      const { commentId } = c.req.param();
      const { text } = c.req.valid("json");
      const user = c.get("user");
      const db = await getMongoDb();

      const comment = await db
        .collection("comments")
        .findOne({ _id: new ObjectId(commentId) });

      if (!comment) {
        return c.json({ error: "Comment not found" }, 404);
      }

      // Check permissions
      if (comment.userId !== user.id && user.role !== "ADMIN") {
        return c.json({ error: "Forbidden" }, 403);
      }

      const result = await db
        .collection("comments")
        .findOneAndUpdate(
          { _id: new ObjectId(commentId) },
          { $set: { text, updatedAt: new Date() } },
          { returnDocument: "after" }
        );

      return c.json(result);
    } catch (error) {
      console.error("Error updating comment:", error);
      return c.json({ error: "Failed to update comment" }, 500);
    }
  }
);

// Delete comment
comments.delete("/:commentId", authenticate, async (c) => {
  try {
    const { commentId } = c.req.param();
    const user = c.get("user");
    const db = await getMongoDb();

    const comment = await db
      .collection("comments")
      .findOne({ _id: new ObjectId(commentId) });

    if (!comment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    // Check permissions
    if (comment.userId !== user.id && user.role !== "ADMIN") {
      return c.json({ error: "Forbidden" }, 403);
    }

    await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });

    return c.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return c.json({ error: "Failed to delete comment" }, 500);
  }
});

// Add reply to comment
comments.post(
  "/:commentId/reply",
  authenticate,
  zValidator("json", z.object({ text: z.string().max(500) })),
  async (c) => {
    try {
      const { commentId } = c.req.param();
      const { text } = c.req.valid("json");
      const user = c.get("user");
      const db = await getMongoDb();

      const reply = {
        userId: user.id,
        text,
        createdAt: new Date(),
      };

      const result = await db
        .collection("comments")
        .findOneAndUpdate(
          { _id: new ObjectId(commentId) },
          { $push: { replies: reply } },
          { returnDocument: "after" }
        );

      if (!result) {
        return c.json({ error: "Comment not found" }, 404);
      }

      return c.json(result, 201);
    } catch (error) {
      console.error("Error adding reply:", error);
      return c.json({ error: "Failed to add reply" }, 500);
    }
  }
);

export default comments;


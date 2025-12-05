import { Hono } from "hono";
import { getMongoDb } from "../mongo/client";
import { authenticate } from "../middleware/auth";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { randomUUID } from "crypto";

const photos = new Hono();

// Get photos for a spot
photos.get("/spot/:spotId", async (c) => {
  try {
    const { spotId } = c.req.param();
    const db = await getMongoDb();
    
    const spotPhotos = await db
      .collection("photos")
      .find({ spotId })
      .sort({ createdAt: -1 })
      .toArray();

    return c.json(spotPhotos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return c.json({ error: "Failed to fetch photos" }, 500);
  }
});

// Upload photo
photos.post("/spot/:spotId", authenticate, async (c) => {
  try {
    const { spotId } = c.req.param();
    const user = c.get("user");
    const db = await getMongoDb();

    // Check photo count limit
    const photoCount = await db
      .collection("photos")
      .countDocuments({ spotId });

    if (photoCount >= 10) {
      return c.json({ error: "Maximum 10 photos per spot allowed" }, 400);
    }

    // Get file from request
    const body = await c.req.parseBody();
    const file = body.photo as File;

    if (!file || !file.name) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Only JPEG, PNG, and WebP allowed" }, 400);
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${randomUUID()}.${ext}`;
    const diskPath = resolve(__dirname, "../../uploads", filename);

    // Save file to disk
    const buffer = await file.arrayBuffer();
    await writeFile(diskPath, Buffer.from(buffer));

    // Save metadata to MongoDB
    const photo = {
      spotId,
      userId: user.id,
      filename,
      title: (body.title as string) || file.name,
      diskPath,
      createdAt: new Date(),
    };

    const result = await db.collection("photos").insertOne(photo);

    return c.json({ ...photo, _id: result.insertedId }, 201);
  } catch (error) {
    console.error("Error uploading photo:", error);
    return c.json({ error: "Failed to upload photo" }, 500);
  }
});

// Delete photo
photos.delete("/:photoId", authenticate, async (c) => {
  try {
    const { photoId } = c.req.param();
    const user = c.get("user");
    const db = await getMongoDb();
    const { ObjectId } = await import("mongodb");

    const photo = await db
      .collection("photos")
      .findOne({ _id: new ObjectId(photoId) });

    if (!photo) {
      return c.json({ error: "Photo not found" }, 404);
    }

    // Check permissions
    if (photo.userId !== user.id && user.role !== "ADMIN") {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Delete file from disk
    const { unlink } = await import("fs/promises");
    try {
      await unlink(photo.diskPath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }

    // Delete metadata from MongoDB
    await db.collection("photos").deleteOne({ _id: new ObjectId(photoId) });

    return c.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return c.json({ error: "Failed to delete photo" }, 500);
  }
});

export default photos;


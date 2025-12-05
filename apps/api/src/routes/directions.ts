import { Hono } from "hono";
import { db } from "../db/client";
import { touristSpots } from "../db/schema";
import { eq } from "drizzle-orm";

const directions = new Hono();

// Get directions to a spot
directions.get("/spot/:spotId", async (c) => {
  try {
    const { spotId } = c.req.param();
    
    const [spot] = await db
      .select()
      .from(touristSpots)
      .where(eq(touristSpots.id, spotId))
      .limit(1);

    if (!spot) {
      return c.json({ error: "Spot not found" }, 404);
    }

    // Generate text directions based on location
    const textDirections = [
      `Navigate to ${spot.name} located in ${spot.city}, ${spot.state}, ${spot.country}.`,
      `Address: ${spot.address}`,
      `Coordinates: ${spot.lat}, ${spot.lng}`,
      `You can use GPS navigation or maps application with these coordinates.`,
    ];

    return c.json({
      spotId: spot.id,
      name: spot.name,
      coordinates: {
        latitude: parseFloat(spot.lat),
        longitude: parseFloat(spot.lng),
      },
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      textDirections,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`,
      appleMapsUrl: `http://maps.apple.com/?ll=${spot.lat},${spot.lng}&q=${encodeURIComponent(spot.name)}`,
    });
  } catch (error) {
    console.error("Error fetching directions:", error);
    return c.json({ error: "Failed to fetch directions" }, 500);
  }
});

export default directions;


import { Hono } from "hono";
import { db } from "../db/client";
import { touristSpots } from "../db/schema";
import { stringify } from "csv-stringify/sync";
import { XMLBuilder } from "fast-xml-parser";
import { z } from "zod";

const exportRouter = new Hono();

// Export spots in various formats
exportRouter.get("/spots", async (c) => {
  try {
    const format = c.req.query("format") || "json";
    
    const spots = await db.select().from(touristSpots);

    // Convert to plain objects
    const data = spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      description: spot.description,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: spot.lat,
      lng: spot.lng,
      address: spot.address,
      averageRating: spot.averageRating,
      createdAt: spot.createdAt.toISOString(),
    }));

    switch (format.toLowerCase()) {
      case "json":
        return c.json(data);

      case "csv": {
        const csv = stringify(data, {
          header: true,
          columns: [
            "id",
            "name",
            "description",
            "city",
            "state",
            "country",
            "lat",
            "lng",
            "address",
            "averageRating",
            "createdAt",
          ],
        });
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", "attachment; filename=tourist-spots.csv");
        return c.body(csv);
      }

      case "xml": {
        const builder = new XMLBuilder({
          ignoreAttributes: false,
          format: true,
        });
        const xml = builder.build({
          touristSpots: {
            spot: data,
          },
        });
        c.header("Content-Type", "application/xml");
        c.header("Content-Disposition", "attachment; filename=tourist-spots.xml");
        return c.body(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`);
      }

      default:
        return c.json({ error: "Invalid format. Use json, csv, or xml" }, 400);
    }
  } catch (error) {
    console.error("Error exporting spots:", error);
    return c.json({ error: "Failed to export spots" }, 500);
  }
});

export default exportRouter;


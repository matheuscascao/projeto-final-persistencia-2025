import { Hono } from "hono";
import { db } from "../db/client";
import { touristSpots } from "../db/schema";
import { parse } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";
import { authenticate, requireRole } from "../middleware/auth";
import { touristSpotCreateSchema } from "@tourism/shared";

const importRouter = new Hono();

// Import spots from various formats (admin only)
importRouter.post(
  "/spots",
  authenticate,
  requireRole("ADMIN"),
  async (c) => {
    try {
      const user = c.get("user");
      const body = await c.req.parseBody();
      const file = body.file as File;
      const format = (body.format as string) || "json";

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      const content = await file.text();
      let spotsData: any[] = [];

      switch (format.toLowerCase()) {
        case "json": {
          const parsed = JSON.parse(content);
          spotsData = Array.isArray(parsed) ? parsed : [parsed];
          break;
        }

        case "csv": {
          spotsData = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
          break;
        }

        case "xml": {
          const parser = new XMLParser({
            ignoreAttributes: false,
          });
          const parsed = parser.parse(content);
          const spots = parsed.touristSpots?.spot;
          spotsData = Array.isArray(spots) ? spots : spots ? [spots] : [];
          break;
        }

        default:
          return c.json({ error: "Invalid format. Use json, csv, or xml" }, 400);
      }

      // Validate and insert spots
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const spotData of spotsData) {
        try {
          // Validate data
          const validated = touristSpotCreateSchema.parse({
            name: spotData.name,
            description: spotData.description,
            city: spotData.city,
            state: spotData.state,
            country: spotData.country,
            lat: parseFloat(spotData.lat),
            lng: parseFloat(spotData.lng),
            address: spotData.address,
          });

          // Insert spot
          await db.insert(touristSpots).values({
            ...validated,
            lat: validated.lat.toString(),
            lng: validated.lng.toString(),
            createdBy: user.id,
          });

          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            spot: spotData.name || "Unknown",
            error: error.message,
          });
        }
      }

      return c.json({
        message: "Import completed",
        results,
      });
    } catch (error) {
      console.error("Error importing spots:", error);
      return c.json({ error: "Failed to import spots" }, 500);
    }
  }
);

export default importRouter;


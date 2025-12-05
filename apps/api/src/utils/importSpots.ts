import { parse } from "csv-parse/sync";
import { z } from "zod";
import {
  TouristSpotCreateInput,
  touristSpotCreateSchema,
} from "@tourism/shared";

const rawSpotSchema = z.object({
  name: z.string(),
  description: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  address: z.string(),
  lat: z.string(),
  lng: z.string(),
});

export type ParsedSpotRow = TouristSpotCreateInput & {
  rowNumber: number;
};

export interface ParsedSpotsResult {
  valid: ParsedSpotRow[];
  errors: { rowNumber: number; issues: string[] }[];
}

export function parseSpotsCsv(csvContent: string): ParsedSpotsResult {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const result: ParsedSpotsResult = { valid: [], errors: [] };

  records.forEach((record, index) => {
    const rowNumber = index + 2; // account for header line
    const primitive = rawSpotSchema.safeParse(record);

    if (!primitive.success) {
      result.errors.push({
        rowNumber,
        issues: primitive.error.issues.map((i) => i.message),
      });
      return;
    }

    const lat = Number(primitive.data.lat);
    const lng = Number(primitive.data.lng);

    const dtoCandidate = {
      ...primitive.data,
      lat,
      lng,
    };

    const validated = touristSpotCreateSchema.safeParse(dtoCandidate);
    if (!validated.success) {
      result.errors.push({
        rowNumber,
        issues: validated.error.issues.map((i) => i.message),
      });
      return;
    }

    result.valid.push({
      ...validated.data,
      rowNumber,
    });
  });

  return result;
}



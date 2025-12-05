import { z } from "zod";

// ---- Core primitives ----

export const idSchema = z.string().uuid();

// ---- User ----

export const userRoleSchema = z.enum(["USER", "ADMIN"]);

export const userBaseSchema = z.object({
  id: idSchema,
  login: z.string().min(3).max(50),
  email: z.string().email(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export const userCreateSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const userLoginSchema = z.object({
  loginOrEmail: z.string().min(3),
  password: z.string().min(8).max(100),
});

export type User = z.infer<typeof userBaseSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;

// ---- Tourist Spot ----

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const touristSpotBaseSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  address: z.string().min(1).max(255),
  lat: coordinatesSchema.shape.lat,
  lng: coordinatesSchema.shape.lng,
  createdBy: idSchema,
  createdAt: z.string().datetime(),
  averageRating: z.number().min(0).max(5).default(0),
});

export const touristSpotCreateSchema = touristSpotBaseSchema
  .omit({
    id: true,
    createdBy: true,
    createdAt: true,
    averageRating: true,
  })
  .extend({
    // createdBy is inferred from auth, not client
  });

export const touristSpotUpdateSchema = touristSpotCreateSchema.partial();

export type TouristSpot = z.infer<typeof touristSpotBaseSchema>;
export type TouristSpotCreateInput = z.infer<typeof touristSpotCreateSchema>;
export type TouristSpotUpdateInput = z.infer<typeof touristSpotUpdateSchema>;

// ---- Lodging ----

export const lodgingTypeSchema = z.enum(["Hotel", "Hostel", "Inn"]);

export const lodgingBaseSchema = z.object({
  id: idSchema,
  spotId: idSchema,
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(255),
  phone: z.string().min(5).max(30),
  avgPrice: z.number().nonnegative(),
  type: lodgingTypeSchema,
  bookingLink: z.string().url().optional().or(z.literal("")),
});

export const lodgingCreateSchema = lodgingBaseSchema.omit({ id: true });
export const lodgingUpdateSchema = lodgingCreateSchema.partial();

export type Lodging = z.infer<typeof lodgingBaseSchema>;
export type LodgingCreateInput = z.infer<typeof lodgingCreateSchema>;
export type LodgingUpdateInput = z.infer<typeof lodgingUpdateSchema>;

// ---- Rating ----

export const ratingBaseSchema = z.object({
  id: idSchema,
  spotId: idSchema,
  userId: idSchema,
  score: z.number().int().min(1).max(5),
  summaryComment: z.string().min(1).max(500),
  createdAt: z.string().datetime(),
});

export const ratingCreateSchema = ratingBaseSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .extend({
    // userId inferred from auth
  });

export const ratingUpdateSchema = z.object({
  score: z.number().int().min(1).max(5).optional(),
  summaryComment: z.string().min(1).max(500).optional(),
});

export type Rating = z.infer<typeof ratingBaseSchema>;
export type RatingCreateInput = z.infer<typeof ratingCreateSchema>;
export type RatingUpdateInput = z.infer<typeof ratingUpdateSchema>;

// ---- Favorite ----

export const favoriteBaseSchema = z.object({
  id: idSchema,
  spotId: idSchema,
  userId: idSchema,
  createdAt: z.string().datetime(),
});

export const favoriteCreateSchema = favoriteBaseSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .extend({
    // userId from auth
  });

export type Favorite = z.infer<typeof favoriteBaseSchema>;
export type FavoriteCreateInput = z.infer<typeof favoriteCreateSchema>;

// ---- MongoDB: Comments ----

export const commentMetadataSchema = z.object({
  device: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(10).optional(),
});

export const commentReplySchema = z.object({
  _id: z.string(), // Mongo ObjectId serialized
  userId: idSchema,
  text: z.string().min(1).max(500),
  createdAt: z.string().datetime(),
});

export const commentBaseSchema = z.object({
  _id: z.string(),
  spotId: idSchema,
  userId: idSchema,
  text: z.string().min(1).max(500),
  createdAt: z.string().datetime(),
  metadata: commentMetadataSchema.optional(),
  replies: z.array(commentReplySchema).default([]),
});

export const commentCreateSchema = z.object({
  spotId: idSchema,
  text: z.string().min(1).max(500),
  metadata: commentMetadataSchema.optional(),
});

export const commentUpdateSchema = z.object({
  text: z.string().min(1).max(500),
});

export type Comment = z.infer<typeof commentBaseSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;

// ---- MongoDB: Photos ----

export const photoBaseSchema = z.object({
  _id: z.string(),
  spotId: idSchema,
  userId: idSchema,
  filename: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  diskPath: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const photoCreateSchema = z.object({
  spotId: idSchema,
  title: z.string().min(1).max(255).optional(),
});

export type Photo = z.infer<typeof photoBaseSchema>;
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

// ---- Export convenience ----

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});



import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  login: text("login").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tourist spots

export const touristSpots = pgTable("tourist_spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  address: text("address").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  averageRating: numeric("average_rating", {
    precision: 3,
    scale: 2,
  })
    .notNull()
    .default("0"),
});

// Unique constraint: name per city can be handled in migrations, but model here
// drizzle-kit will infer an index from custom SQL if needed later.

// Lodgings

export const lodgings = pgTable("lodgings", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotId: uuid("spot_id")
    .notNull()
    .references(() => touristSpots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  avgPrice: numeric("avg_price", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // Hotel/Hostel/Inn
  bookingLink: text("booking_link"),
});

// Ratings

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotId: uuid("spot_id")
    .notNull()
    .references(() => touristSpots.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  summaryComment: text("summary_comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One rating per user per spot should be enforced via a composite unique index
// in migrations; drizzle-kit can derive that from an index definition.

// Favorites

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotId: uuid("spot_id")
    .notNull()
    .references(() => touristSpots.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations (for type-safe joins)

export const usersRelations = relations(users, ({ many }) => ({
  spots: many(touristSpots),
  ratings: many(ratings),
  favorites: many(favorites),
}));

export const touristSpotsRelations = relations(touristSpots, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [touristSpots.createdBy],
    references: [users.id],
  }),
  lodgings: many(lodgings),
  ratings: many(ratings),
  favorites: many(favorites),
}));

export const lodgingsRelations = relations(lodgings, ({ one }) => ({
  spot: one(touristSpots, {
    fields: [lodgings.spotId],
    references: [touristSpots.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  spot: one(touristSpots, {
    fields: [ratings.spotId],
    references: [touristSpots.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  spot: one(touristSpots, {
    fields: [favorites.spotId],
    references: [touristSpots.id],
  }),
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));



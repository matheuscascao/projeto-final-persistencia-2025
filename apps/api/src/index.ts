import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env";
import auth from "./routes/auth";
import spots from "./routes/spots";
import ratings from "./routes/ratings";
import comments from "./routes/comments";
import photos from "./routes/photos";
import lodgings from "./routes/lodgings";
import directions from "./routes/directions";
import exportRouter from "./routes/export";
import favorites from "./routes/favorites";
import importRouter from "./routes/import";

import { serveStatic } from "hono/bun";

const app = new Hono();

// Serve uploaded files
app.use("/uploads/*", serveStatic({ root: "./" }));

// Enable CORS
app.use("/*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

// Mount routes
app.route("/auth", auth);
app.route("/spots", spots);
app.route("/ratings", ratings);
app.route("/comments", comments);
app.route("/photos", photos);
app.route("/lodgings", lodgings);
app.route("/directions", directions);
app.route("/export", exportRouter);
app.route("/import", importRouter);
app.route("/favorites", favorites);

console.log("✓ All routes mounted successfully");

export default {
  port: env.PORT,
  fetch: app.fetch,
};
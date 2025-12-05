import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";
import { z } from "zod";

const auth = new Hono();

const registerSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register endpoint
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  try {
    const { login, email, password } = c.req.valid("json");

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        login,
        email,
        passwordHash,
        role: "USER",
      })
      .returning();

    // Generate JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ role: newUser.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(newUser.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return c.json(
      {
        user: {
          id: newUser.id,
          login: newUser.login,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login endpoint
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return c.json({
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get current user endpoint
auth.get("/me", async (c) => {
  const authHeader = c.req.header("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.sub) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const [user] = await db
      .select({
        id: users.id,
        login: users.login,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub as string))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  } catch (error) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

export default auth;


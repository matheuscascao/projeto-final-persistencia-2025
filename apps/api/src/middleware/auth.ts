import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { env } from "../config/env";

export interface AuthUser {
  id: string;
  role: string;
}

// Extend Hono context to include user
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authenticate(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized - No token provided" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.sub || !payload.role) {
      return c.json({ error: "Invalid token" }, 401);
    }

    c.set("user", {
      id: payload.sub as string,
      role: payload.role as string,
    });

    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized - Invalid token" }, 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden - Insufficient permissions" }, 403);
    }

    await next();
  };
}


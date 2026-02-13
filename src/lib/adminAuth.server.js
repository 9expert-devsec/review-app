import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function clean(x) {
  return String(x || "").trim();
}

function getSecret() {
  const s = clean(process.env.ADMIN_JWT_SECRET);
  if (!s) {
    const err = new Error("Missing ADMIN_JWT_SECRET");
    err.status = 500;
    throw err;
  }
  return s;
}

export function signAdminToken(payload, expiresIn = "8h") {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, getSecret());
}

export async function requireAdmin() {
  const jar = await cookies();
  const token = clean(jar.get("admin_token")?.value);
  if (!token) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  try {
    const decoded = verifyAdminToken(token);
    return decoded;
  } catch {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

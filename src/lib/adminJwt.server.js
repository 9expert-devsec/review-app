import { SignJWT, jwtVerify } from "jose";

function secret() {
  const s = process.env.ADMIN_JWT_SECRET || "";
  if (!s) throw new Error("Missing ADMIN_JWT_SECRET");
  return new TextEncoder().encode(s);
}

export async function signAdminToken(payload, expiresIn = "7d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyAdminToken(token) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

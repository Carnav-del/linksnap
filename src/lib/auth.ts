import { SignJWT, jwtVerify } from "jose";

// We use "jose" instead of the popular "jsonwebtoken" package because jose
// works in BOTH the normal Node.js runtime and the Edge runtime (which we
// need for the live-updates/streaming route). jsonwebtoken only works in
// Node.js and would crash on Edge.

export const AUTH_COOKIE_NAME = "linksnap_token";

const secretKey = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not set. Add it to your .env.local file (see .env.example)."
    );
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export type SessionPayload = {
  userId: number;
  email: string;
};

// Creates a signed token that expires in 7 days.
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

// Verifies a token and returns the payload, or null if invalid/expired.
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "number" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

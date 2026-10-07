import { SignJWT, jwtVerify } from "jose";
import type { UjiMode, UjiUser } from "../shared/uji.js";

const COOKIE = "uji_deporte_session";
const MAX_AGE = 60 * 60 * 12;

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-only-change-me-uji-deporte",
  );
}

export async function createToken(
  user: UjiUser,
  mode: UjiMode,
  sid?: string,
) {
  return new SignJWT({
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    mode,
    sid: sid ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export type AppSession = {
  user: UjiUser;
  mode: UjiMode;
  sid?: string;
};

export async function verifyToken(token: string): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const username = String(payload.username ?? "");
    if (!username) return null;
    return {
      user: {
        username,
        displayName: String(payload.displayName ?? username),
        email: payload.email ? String(payload.email) : undefined,
      },
      mode: (payload.mode as UjiMode) || "live",
      sid: payload.sid ? String(payload.sid) : undefined,
    };
  } catch {
    return null;
  }
}

export { MAX_AGE as APP_SESSION_MAX_AGE };

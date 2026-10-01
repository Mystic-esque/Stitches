import { createHash, randomBytes } from "node:crypto";

export const GUEST_COOKIE = "stitches_guest";
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;

export interface GuestIdentity {
  token: string;
  ownerId: string;
  newSession: boolean;
}

export function resolveGuestIdentity(cookieValue?: string): GuestIdentity {
  const valid = cookieValue !== undefined && TOKEN_FORMAT.test(cookieValue);
  const token = valid ? cookieValue : randomBytes(32).toString("base64url");
  return {
    token,
    ownerId: createHash("sha256").update(token).digest("hex"),
    newSession: !valid,
  };
}

export function guestCookieOptions(secure: boolean) {
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
}

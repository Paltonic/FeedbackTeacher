import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Password protection for the results page — SERVER ONLY.
 *
 * Set the password in .env.local (and in your hosting env vars):
 *   RESULTS_PASSWORD=your-secret-password
 *
 * After a correct password we store a signed token (not the password itself)
 * in an httpOnly cookie, so the browser's JavaScript can't read or fake it.
 * Changing RESULTS_PASSWORD logs everyone out automatically.
 */

export const RESULTS_COOKIE = "results_access";
export const RESULTS_MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): string | null {
  const pw = process.env.RESULTS_PASSWORD?.trim();
  return pw ? pw : null;
}

/** Token derived from the password — valid only while the password stays the same. */
export function makeToken(): string | null {
  const pw = secret();
  return pw ? createHmac("sha256", pw).update("nakamura-results-access").digest("hex") : null;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isCorrectPassword(input: string): boolean {
  const pw = secret();
  return !!pw && safeEqual(input, pw);
}

/** True if the current visitor has unlocked the results page. */
export async function hasResultsAccess(): Promise<boolean> {
  const expected = makeToken();
  if (!expected) return false;
  const token = (await cookies()).get(RESULTS_COOKIE)?.value;
  return !!token && safeEqual(token, expected);
}

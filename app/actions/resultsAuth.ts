"use server";

import { cookies } from "next/headers";
import { RESULTS_COOKIE, RESULTS_MAX_AGE, isCorrectPassword, makeToken } from "@/lib/results-auth";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function unlockResults(password: string): Promise<{ success: boolean; error?: string }> {
  const token = makeToken();
  if (!token) {
    console.error("[unlockResults] RESULTS_PASSWORD is not set in the environment");
    return { success: false, error: "Results page is not configured yet." };
  }

  if (!isCorrectPassword(String(password ?? ""))) {
    await wait(800); // slow down password guessing
    return { success: false, error: "Wrong password. Please try again." };
  }

  (await cookies()).set(RESULTS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESULTS_MAX_AGE,
  });
  return { success: true };
}

export async function lockResults(): Promise<void> {
  (await cookies()).delete(RESULTS_COOKIE);
}

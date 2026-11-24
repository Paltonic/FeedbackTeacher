"use server";

import { feedbackSchema } from "@/lib/schemas/feedback";
import { appendFeedback, DuplicateFeedbackError } from "@/lib/feedback-db";
import { isKnownSelection } from "@/lib/master-data";
import { getMasterOptions } from "@/app/actions/getMasterOptions";

export async function submitFeedback(
  input: unknown
): Promise<{ success: boolean; error?: string; duplicate?: boolean }> {
  // Validate again on the server — never trust data coming from the browser
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  // Class, student and teacher must come from the master lists
  const master = await getMasterOptions();
  if (!isKnownSelection(master, parsed.data)) {
    return { success: false, error: "Please choose your class, name and teacher from the lists" };
  }

  try {
    await appendFeedback(parsed.data);
    return { success: true };
  } catch (err) {
    if (err instanceof DuplicateFeedbackError) {
      return {
        success: false,
        duplicate: true,
        error: `You have already submitted feedback for ${parsed.data.teacherName}. Each student can rate a teacher only once.`,
      };
    }
    console.error("[submitFeedback] Firestore error:", err);
    return { success: false, error: `Failed to save feedback — ${explain(err)}` };
  }
}
/** Turns a Firestore / config error into a short hint (no secrets). */
function explain(err: unknown): string {
  const e = err as { code?: unknown; message?: unknown };
  const msg = String(e?.message ?? "");
  if (/Missing env vars/i.test(msg)) return "server is missing FIREBASE_* environment variables.";
  switch (e?.code) {
    case 5: case "not-found":
      return "Firestore database not found (create it in Firebase Console → Firestore).";
    case 7: case "permission-denied":
      return "permission denied (check the service account has Firestore access).";
    case 8: case "resource-exhausted":
      return "daily Firestore quota is used up — try again after it resets (~14.00–15.00 WIB).";
    case 9: case "failed-precondition":
      return "Firestore needs an index or is not set up yet (see the server log for the link).";
    case 14: case "unavailable":
      return "Firestore is temporarily unreachable — please try again.";
    case 16: case "unauthenticated":
      return "Firebase credentials are invalid (check FIREBASE_PRIVATE_KEY / CLIENT_EMAIL).";
  }
  return `please try again (code: ${String(e?.code ?? "unknown")}).`;
}
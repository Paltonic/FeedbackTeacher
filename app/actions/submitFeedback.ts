"use server";

import { feedbackSchema } from "@/lib/schemas/feedback";
import { appendFeedback } from "@/lib/feedback-db";

export async function submitFeedback(
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  // Validate again on the server — never trust data coming from the browser
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  try {
    await appendFeedback(parsed.data);
    return { success: true };
  } catch (err) {
    console.error("[submitFeedback] Firestore error:", err);
    return { success: false, error: "Failed to save feedback" };
  }
}
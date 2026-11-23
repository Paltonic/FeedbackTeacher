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
    return { success: false, error: "Failed to save feedback" };
  }
}
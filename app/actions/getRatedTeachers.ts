"use server";

import { getTeachersRatedBy } from "@/lib/feedback-db";

/** Teachers the given student has already rated — used to hide them in the form. */
export async function getRatedTeachers(name: string, cls: string): Promise<string[]> {
  try {
    return await getTeachersRatedBy(String(name ?? ""), String(cls ?? ""));
  } catch (err) {
    console.error("[getRatedTeachers] Firestore error:", err);
    return []; // the server still blocks duplicates on submit
  }
}

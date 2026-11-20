"use server";

import { feedbackSchema, FeedbackFormData } from "@/lib/schemas/feedback";

export async function submitFeedback(data: FeedbackFormData) {
  // Validasi ulang di server (opsional tapi disarankan)
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // -- DI SINI ANDA BISA MENYIMPAN KE DATABASE --
  // Contoh: await prisma.feedback.create({ data: parsed.data });
  // Atau kirim ke Google Sheets API, dsb.
  console.log("Feedback submitted:", parsed.data);

  // Simulasi delay jaringan
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true, message: "Feedback submitted successfully!" };
}
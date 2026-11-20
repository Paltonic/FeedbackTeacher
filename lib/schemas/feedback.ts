import { z } from "zod";

// Skala Likert 1-4
const scaleSchema = z.enum(["1", "2", "3", "4"], {
  error: "Please select a rating (1-4)",
});

export const feedbackSchema = z.object({
  // Bagian 1
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  teacherName: z.string().min(1, "Teacher name is required"),

  // Bagian 2: Professional Competence
  professional1: scaleSchema,
  professional2: scaleSchema,
  professional3: scaleSchema,
  professional4: scaleSchema,
  professional5: scaleSchema,
  professional6: scaleSchema,
  professionalSuggestion: z.string().optional(),

  // Bagian 3: Pedagogical Competence
  pedagogical1: scaleSchema,
  pedagogical2: scaleSchema,
  pedagogical3: scaleSchema,
  pedagogical4: scaleSchema,
  pedagogical5: scaleSchema,
  pedagogical6: scaleSchema,
  pedagogicalSuggestion: z.string().optional(),

  // Bagian 4: Social Competence
  social1: scaleSchema,
  social2: scaleSchema,
  social3: scaleSchema,
  social4: scaleSchema,
  social5: scaleSchema,
  social6: scaleSchema,
  social7: scaleSchema,
  socialSuggestion: z.string().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
"use server";

import { hasResultsAccess } from "@/lib/results-auth";
import { getFeedbackByTeacher } from "@/lib/feedback-db";
import { getMasterOptions } from "@/app/actions/getMasterOptions";
import { CATEGORIES, type CategoryKey } from "@/lib/questions";

export type RatingKey = 1 | 2 | 3 | 4;

export type QuestionResult = {
  id: string;
  number: number;
  text: string;
  total: number; // students who answered this question
  counts: Record<RatingKey, number>; // how many chose 1, 2, 3, 4
  percents: Record<RatingKey, number>; // same, as % of total
};

export type CategoryResult = {
  key: CategoryKey;
  title: string;
  positive: number; // all 3 (Often) + 4 (Always) answers in this category
  total: number; // all answers in this category
  percent: number; // % of answers that were 3 or 4
  questions: QuestionResult[];
  comments: string[]; // students' suggestions for this category (anonymous, newest first)
};

export type TeacherResults = {
  teacherName: string;
  responses: number;
  categories: CategoryResult[];
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

/** Only callable after unlocking the results page. */
export async function getResultsTeachers(): Promise<string[]> {
  if (!(await hasResultsAccess())) throw new Error("Unauthorized");
  return (await getMasterOptions()).teachers;
}

/**
 * For one teacher: per question, the share of each rating 1–4; per category,
 * the share of answers that were 3 (Often) or 4 (Always). Only totals leave the server —
 * never individual students' answers or names.
 */
export async function getTeacherResults(teacherName: string): Promise<TeacherResults> {
  if (!(await hasResultsAccess())) throw new Error("Unauthorized");

  const list = await getFeedbackByTeacher(String(teacherName ?? ""));
  const RATINGS: RatingKey[] = [1, 2, 3, 4];

  const categories = CATEGORIES.map((cat) => {
    const questions = cat.questions.map((q, i) => {
      const values = list.map((f) => Number(f[q.id as keyof typeof f])).filter((v) => v >= 1 && v <= 4);
      const total = values.length;
      const counts = Object.fromEntries(RATINGS.map((r) => [r, values.filter((v) => v === r).length])) as Record<RatingKey, number>;
      const percents = Object.fromEntries(RATINGS.map((r) => [r, pct(counts[r], total)])) as Record<RatingKey, number>;
      return { id: q.id, number: i + 1, text: q.text, total, counts, percents };
    });
    const positive = questions.reduce((n, q) => n + q.counts[3] + q.counts[4], 0);
    const total = questions.reduce((n, q) => n + q.total, 0);

    // Comments are sent WITHOUT names to keep them anonymous
    const field = `${cat.key}Suggestion` as const;
    const comments = list.map((f) => String(f[field] ?? "").trim()).filter(Boolean);
    return { key: cat.key, title: cat.title, positive, total, percent: pct(positive, total), questions, comments };
  });

  return { teacherName, responses: list.length, categories };
}

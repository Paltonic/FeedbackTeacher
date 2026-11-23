import { createHash } from "node:crypto";
import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { FeedbackFormData } from "@/lib/schemas/feedback";
import { db } from "@/lib/firebase-admin";

/**
 * Feedback "database" layer on Firestore.
 * Collection: feedback  → one document per submitted form.
 */

const COLLECTION = "feedback";

const PROFESSIONAL = ["professional1", "professional2", "professional3", "professional4", "professional5", "professional6"] as const;
const PEDAGOGICAL = ["pedagogical1", "pedagogical2", "pedagogical3", "pedagogical4", "pedagogical5", "pedagogical6"] as const;
const SOCIAL = ["social1", "social2", "social3", "social4", "social5", "social6", "social7"] as const;
const RATING_FIELDS = [...PROFESSIONAL, ...PEDAGOGICAL, ...SOCIAL] as const satisfies readonly (keyof FeedbackFormData)[];
type RatingField = (typeof RATING_FIELDS)[number];

export type Averages = { professional: number; pedagogical: number; social: number; overall: number };

/** What you get back when reading (plain JSON — safe to pass to client components). */
export type Feedback = {
  id: string;
  name: string;
  class: string;
  teacherName: string;
  professionalSuggestion: string;
  pedagogicalSuggestion: string;
  socialSuggestion: string;
  averages: Averages;
  createdAt: string | null; // ISO string
  updatedAt: string | null;
} & Record<RatingField, number>;

type FormInput = Partial<Record<keyof FeedbackFormData, unknown>>;

// ---------- helpers ----------

const round2 = (n: number) => Math.round(n * 100) / 100;
const mean = (nums: number[]) => (nums.length ? round2(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
const str = (v: unknown) => String(v ?? "").trim();

/** Clean the form data: ratings → numbers, text trimmed, averages precomputed. */
function normalize(input: FormInput) {
  const ratings = Object.fromEntries(
    RATING_FIELDS.map((f) => [f, Number(input[f])])
  ) as Record<RatingField, number>;

  const pick = (fields: readonly RatingField[]) => fields.map((f) => ratings[f]);
  const teacherName = str(input.teacherName);

  return {
    name: str(input.name),
    class: str(input.class),
    teacherName,
    teacherNameLower: teacherName.toLowerCase(), // for case-insensitive search
    ...ratings,
    professionalSuggestion: str(input.professionalSuggestion),
    pedagogicalSuggestion: str(input.pedagogicalSuggestion),
    socialSuggestion: str(input.socialSuggestion),
    averages: {
      professional: mean(pick(PROFESSIONAL)),
      pedagogical: mean(pick(PEDAGOGICAL)),
      social: mean(pick(SOCIAL)),
      overall: mean(pick(RATING_FIELDS)),
    } satisfies Averages,
  };
}

const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

function fromDoc(snap: DocumentSnapshot): Feedback {
  const d = snap.data() ?? {};
  const { teacherNameLower: _omit, createdAt, updatedAt, ...rest } = d;
  return { ...(rest as Omit<Feedback, "id" | "createdAt" | "updatedAt">), id: snap.id, createdAt: toIso(createdAt), updatedAt: toIso(updatedAt) };
}

// ---------- ONE RESPONSE PER STUDENT PER TEACHER ----------

/** Thrown when this student already rated this teacher. */
export class DuplicateFeedbackError extends Error {
  constructor() {
    super("This student has already submitted feedback for this teacher");
    this.name = "DuplicateFeedbackError";
  }
}

const key = (v: unknown) => str(v).toLowerCase();

/**
 * Document ID built from class + student + teacher, so the database itself
 * can hold only ONE response per pair (keep in sync with scripts/seed-dummy-feedback.mjs).
 */
export function feedbackId(sel: { class: unknown; name: unknown; teacherName: unknown }): string {
  return createHash("sha256")
    .update(`${key(sel.class)}|${key(sel.name)}|${key(sel.teacherName)}`)
    .digest("hex")
    .slice(0, 40);
}

/** Older responses were saved with random IDs — find those by their fields. */
async function legacyResponseExists(sel: { class: string; name: string; teacherName: string }): Promise<boolean> {
  const snap = await db()
    .collection(COLLECTION)
    .where("teacherNameLower", "==", key(sel.teacherName))
    .where("name", "==", str(sel.name))
    .get();
  return snap.docs.some((d) => key(d.get("class")) === key(sel.class));
}

/** Teachers this student has already rated (exact names as stored). */
export async function getTeachersRatedBy(name: string, cls: string): Promise<string[]> {
  if (!str(name) || !str(cls)) return [];
  const snap = await db().collection(COLLECTION).where("name", "==", str(name)).get();
  const rated = snap.docs
    .filter((d) => key(d.get("class")) === key(cls))
    .map((d) => str(d.get("teacherName")));
  return [...new Set(rated)];
}

// ---------- CREATE ----------

/** Saves a response. Throws DuplicateFeedbackError if this student already rated this teacher. */
export async function appendFeedback(data: FeedbackFormData): Promise<string> {
  const clean = normalize(data);
  if (await legacyResponseExists(clean)) throw new DuplicateFeedbackError();

  const ref = db().collection(COLLECTION).doc(feedbackId(clean));
  try {
    // create() fails if the document already exists — safe even if two submits arrive at once
    await ref.create({ ...clean, createdAt: FieldValue.serverTimestamp(), updatedAt: null });
  } catch (err) {
    const code = (err as { code?: unknown })?.code;
    if (code === 6 || code === "already-exists" || /already exists/i.test(String((err as Error)?.message))) {
      throw new DuplicateFeedbackError();
    }
    throw err;
  }
  return ref.id;
}

// ---------- READ ----------

/** All feedback, newest first. */
export async function readFeedback(): Promise<Feedback[]> {
  const snap = await db().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map(fromDoc);
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? fromDoc(snap) : null;
}

/** All feedback for one teacher (case-insensitive), newest first. */
export async function getFeedbackByTeacher(teacherName: string): Promise<Feedback[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("teacherNameLower", "==", teacherName.trim().toLowerCase())
    .get();
  // sort here instead of orderBy() so no composite index is needed
  return snap.docs.map(fromDoc).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Average scores per teacher — handy for a results dashboard. */
export async function getTeacherSummaries() {
  const all = await readFeedback();
  const groups = new Map<string, Feedback[]>();
  for (const f of all) {
    const key = f.teacherName.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()]
    .map((list) => ({
      teacherName: list[0].teacherName,
      responses: list.length,
      professional: mean(list.map((f) => f.averages.professional)),
      pedagogical: mean(list.map((f) => f.averages.pedagogical)),
      social: mean(list.map((f) => f.averages.social)),
      overall: mean(list.map((f) => f.averages.overall)),
    }))
    .sort((a, b) => b.overall - a.overall);
}

// ---------- UPDATE ----------

export async function updateFeedback(id: string, changes: Partial<FeedbackFormData>): Promise<boolean> {
  const ref = db().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;

  const merged = { ...(snap.data() as FormInput), ...changes };
  await ref.update({ ...normalize(merged), updatedAt: FieldValue.serverTimestamp() });
  return true;
}

// ---------- DELETE ----------

export async function deleteFeedback(id: string): Promise<boolean> {
  const ref = db().collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}

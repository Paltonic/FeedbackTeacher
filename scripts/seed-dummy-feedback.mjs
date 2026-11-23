// Insert DUMMY feedback responses into Firestore so you can preview /results.
//
// Usage (from the project root):
//   npm run seed:dummy                                  → 60 responses for "Erick Sensei"
//   npm run seed:dummy -- --teacher "Noah Sensei"       → another teacher
//   npm run seed:dummy -- --count 30                    → different number of responses
//   npm run seed:dummy -- --clear                       → delete ALL dummy responses (real ones are untouched)
//
// Every dummy document has  isDummy: true  so it can be removed safely later.
// One response per student per teacher: running it again for the same teacher
// OVERWRITES the dummy responses instead of adding duplicates.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ---------- args ----------
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const CLEAR = args.includes("--clear");
const TEACHER = arg("teacher", "Erick Sensei");
const COUNT = Math.max(1, Number(arg("count", 60)) || 60);

// ---------- firebase ----------
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("❌ Env vars not found. Run with:  npm run seed:dummy   (it loads .env.local)");
  process.exit(1);
}
initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();
const col = db.collection("feedback");

// ---------- --clear ----------
if (CLEAR) {
  const snap = await col.where("isDummy", "==", true).get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`🗑  Deleted ${snap.size} dummy responses.`);
  process.exit(0);
}

// ---------- generate ----------
// Chance that a student answers 3 or 4, per question — varied so the chart has shape.
const POSITIVE_CHANCE = {
  professional1: 0.85, professional2: 0.7, professional3: 0.9, professional4: 0.45, professional5: 0.8, professional6: 0.6,
  pedagogical1: 0.55, pedagogical2: 0.88, pedagogical3: 0.75, pedagogical4: 0.4, pedagogical5: 0.65, pedagogical6: 0.7,
  social1: 0.92, social2: 0.85, social3: 0.78, social4: 0.8, social5: 0.5, social6: 0.72, social7: 0.83,
};
const FIELDS = Object.keys(POSITIVE_CHANCE);
const PROFESSIONAL = FIELDS.filter((f) => f.startsWith("professional"));
const PEDAGOGICAL = FIELDS.filter((f) => f.startsWith("pedagogical"));
const SOCIAL = FIELDS.filter((f) => f.startsWith("social"));

const SUGGESTIONS = [
  "", "", "", // most students leave it empty
  "Please give more examples.",
  "More group activities would be fun.",
  "Sometimes the explanation is too fast.",
  "Great teacher, keep it up!",
  "Could you share the slides after class?",
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rating = (chance) =>
  Math.random() < chance ? (Math.random() < 0.55 ? 4 : 3) : Math.random() < 0.6 ? 2 : 1;
const round2 = (n) => Math.round(n * 100) / 100;
const mean = (nums) => (nums.length ? round2(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

// Use real student names first, then "Dummy Student N" if more are needed.
let students = [];
try {
  students = JSON.parse(readFileSync("data/master-data.json", "utf8")).students ?? [];
} catch {}
students = [...students].sort(() => Math.random() - 0.5);

const now = Date.now();
const docs = Array.from({ length: COUNT }, (_, i) => {
  const s = students[i] ?? { name: `Dummy Student ${i + 1}`, class: "J1A" };
  const ratings = Object.fromEntries(FIELDS.map((f) => [f, rating(POSITIVE_CHANCE[f])]));
  const avg = (fields) => mean(fields.map((f) => ratings[f]));
  return {
    // same shape as lib/feedback-db.ts → normalize()
    name: s.name,
    class: s.class,
    teacherName: TEACHER,
    teacherNameLower: TEACHER.toLowerCase(),
    ...ratings,
    professionalSuggestion: pick(SUGGESTIONS),
    pedagogicalSuggestion: pick(SUGGESTIONS),
    socialSuggestion: pick(SUGGESTIONS),
    averages: {
      professional: avg(PROFESSIONAL),
      pedagogical: avg(PEDAGOGICAL),
      social: avg(SOCIAL),
      overall: avg(FIELDS),
    },
    createdAt: Timestamp.fromMillis(now - i * 60_000), // spread over the last hour
    updatedAt: null,
    isDummy: true,
  };
});

// Same ID rule as lib/feedback-db.ts → feedbackId()
const key = (v) => String(v ?? "").trim().toLowerCase();
const feedbackId = (d) =>
  createHash("sha256").update(`${key(d.class)}|${key(d.name)}|${key(d.teacherName)}`).digest("hex").slice(0, 40);

const batch = db.batch();
docs.forEach((d) => batch.set(col.doc(feedbackId(d)), d));
await batch.commit();

console.log(`✅ Saved ${COUNT} dummy responses for "${TEACHER}" (one per student).`);
console.log(`   Open /results, unlock, and choose "${TEACHER}".`);
console.log(`   Remove them later with:  npm run seed:dummy -- --clear`);

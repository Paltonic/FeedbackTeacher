// Upload the class / teacher / student lists to Firestore (document: settings/master).
//
// Usage (from the project root):
//   npm run seed                      → uses data/master-data.json
//   npm run seed -- data/other.json   → uses another file
//
// Running it again REPLACES the lists with the file's content.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const file = process.argv[2] ?? "data/master-data.json";

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("❌ Env vars not found. Run with:  npm run seed   (it loads .env.local)");
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`❌ Cannot read ${file}: ${e.message}`);
  process.exit(1);
}

// ---- clean up: trim, de-duplicate, sort (same rules as lib/master-types.ts) ----
const clean = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
const sortId = (a, b) => a.localeCompare(b, "id", { numeric: true, sensitivity: "base" });
const arr = (v) => (Array.isArray(v) ? v : []);

const classes = [...new Set(arr(raw.classes).map(clean).filter(Boolean))].sort(sortId);
const teachers = [...new Set(arr(raw.teachers).map(clean).filter(Boolean))].sort(sortId);

const seen = new Set();
const students = arr(raw.students)
  .map((s) => ({ name: clean(s?.name), class: clean(s?.class) }))
  .filter((s) => s.name && s.class)
  .filter((s) => {
    const k = `${s.class}|${s.name}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .sort((a, b) => sortId(a.class, b.class) || sortId(a.name, b.name));

// ---- sanity checks ----
const unknown = [...new Set(students.filter((s) => !classes.includes(s.class)).map((s) => s.class))];
if (unknown.length) {
  console.error(`❌ These student classes are not in "classes": ${unknown.join(", ")}`);
  console.error("   Add them to the classes list (or fix the typo), then run again.");
  process.exit(1);
}
const emptyClasses = classes.filter((c) => !students.some((s) => s.class === c));
if (emptyClasses.length) console.warn(`⚠  Classes with no students: ${emptyClasses.join(", ")}`);

// ---- upload ----
initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

await getFirestore()
  .collection("settings")
  .doc("master")
  .set({ classes, teachers, students, updatedAt: FieldValue.serverTimestamp() });

console.log(`✅ Uploaded to Firestore (settings/master):`);
console.log(`   ${classes.length} classes, ${teachers.length} teachers, ${students.length} students`);

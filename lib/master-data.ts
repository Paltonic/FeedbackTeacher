import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { normalizeMaster, type MasterData } from "@/lib/master-types";

/**
 * Class / teacher / student lists — SERVER ONLY.
 * Stored as ONE Firestore document (settings/master) so loading the form
 * costs a single read, no matter how many students there are.
 */

const masterRef = () => db().collection("settings").doc("master");

export async function getMasterData(): Promise<MasterData> {
  const snap = await masterRef().get();
  return normalizeMaster(snap.data() ?? {});
}

export async function saveMasterData(data: MasterData): Promise<MasterData> {
  const clean = normalizeMaster(data);
  await masterRef().set({ ...clean, updatedAt: FieldValue.serverTimestamp() });
  return clean;
}

/** Server-side check that the submitted class/student/teacher really exist. */
export function isKnownSelection(
  master: MasterData,
  sel: { class: string; name: string; teacherName: string }
): boolean {
  return (
    master.classes.includes(sel.class) &&
    master.teachers.includes(sel.teacherName) &&
    master.students.some((s) => s.class === sel.class && s.name === sel.name)
  );
}

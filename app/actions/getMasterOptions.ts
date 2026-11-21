"use server";

import { getMasterData } from "@/lib/master-data";
import { normalizeMaster, type MasterData } from "@/lib/master-types";
import fallback from "@/data/master-data.json";

/**
 * Class / student / teacher lists for the dropdowns.
 * Reads Firestore (settings/master). If that document is still empty
 * (seed not run yet) or Firestore fails, falls back to data/master-data.json
 * so the form keeps working.
 */
export async function getMasterOptions(): Promise<MasterData> {
  try {
    const master = await getMasterData();
    if (master.students.length && master.teachers.length) return master;
    console.warn("[getMasterOptions] settings/master is empty — using data/master-data.json. Run `npm run seed`.");
  } catch (err) {
    console.error("[getMasterOptions] Firestore error — using data/master-data.json:", err);
  }
  return normalizeMaster(fallback);
}
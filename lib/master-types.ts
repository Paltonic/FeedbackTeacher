// Shared types + helpers for the dropdown lists (safe to import from client AND server).

export type Student = { name: string; class: string };

export type MasterData = {
  classes: string[];
  teachers: string[];
  students: Student[];
};

const clean = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");
const sortId = (a: string, b: string) => a.localeCompare(b, "id", { numeric: true, sensitivity: "base" });

/** Trim, remove empties/duplicates, sort A→Z (S2 before S10). */
export function normalizeMaster(raw: Partial<Record<keyof MasterData, unknown>>): MasterData {
  const list = (v: unknown) => (Array.isArray(v) ? v : []);

  const classes = [...new Set(list(raw.classes).map(clean).filter(Boolean))].sort(sortId);
  const teachers = [...new Set(list(raw.teachers).map(clean).filter(Boolean))].sort(sortId);

  const seen = new Set<string>();
  const students = list(raw.students)
    .map((s) => ({ name: clean((s as Student)?.name), class: clean((s as Student)?.class) }))
    .filter((s) => s.name && s.class)
    .filter((s) => {
      const key = `${s.class}|${s.name}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => sortId(a.class, b.class) || sortId(a.name, b.name));

  return { classes, teachers, students };
}

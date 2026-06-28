// Game role id -> Arabic display name. Mirrors the backend `ROLES` in
// alba3ati-backend/src/utils/constants.js. Shared across admin pages so the
// mapping lives in one place on the dashboard side.
export const ROLES: Record<string, string> = {
  "1": "البعاتي",
  "2": "العمدة",
  "3": "شيخ الدمازين",
  "4": "الكاشف",
  "5": "ابو جنزير",
  "6": "بله اب سيف",
  "7": "بعاتي كبير",
  "8": "جنابو",
  "9": "وَد الزلط",
};

/** Resolve a roleId to its Arabic name, falling back to the raw id, then a dash. */
export function roleName(roleId: string | null | undefined): string {
  if (!roleId) return "—";
  return ROLES[roleId] || roleId;
}

export function formatInr(amount: number): string {
  // Indian numbering system grouping
  const sign = amount < 0 ? -1 : 1;
  const n = Math.abs(amount);
  const s = n.toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const body = rest ? `${grouped},${last3}` : last3;
  return `${sign < 0 ? "-" : ""}₹${body}`;
}

export const TEAM_COLORS: Record<string, string> = {
  R: "#FF3B30",
  G: "#34C759",
  B: "#0A84FF",
};



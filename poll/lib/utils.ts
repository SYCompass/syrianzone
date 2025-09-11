export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


export function formatNumberKM(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const v = value / 1_000_000;
    const s = Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
    return `${s.replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    const v = value / 1_000;
    const s = Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
    return `${s.replace(/\.0$/, "")}K`;
  }
  return String(value);
}



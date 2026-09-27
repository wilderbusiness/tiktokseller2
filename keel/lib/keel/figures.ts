import type { DataOrigin, Figure } from "./types";

export function figure<T>(
  value: T | null,
  source: DataOrigin,
  fetchedAt: string,
  label: string,
): Figure<T> {
  return { value, source, fetchedAt, label };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function combineOrigin(sources: DataOrigin[]): DataOrigin {
  if (sources.includes("modeled")) return "modeled";
  if (sources.includes("manual")) return "manual";
  return "live";
}

export function originLabel(source: DataOrigin): string {
  if (source === "live") return "Live account response";
  if (source === "manual") return "Entered by the operator";
  return "Modeled, not live";
}

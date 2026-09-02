/**
 * Tiny className combiner (clsx-like) with no dependency.
 * Accepts strings, arrays, and { className: boolean } records; drops falsy.
 */
export type ClassValue = string | number | false | null | undefined | ClassValue[] | ClassRecord;
interface ClassRecord {
  [key: string]: boolean | null | undefined;
}

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) push(input, out);
  return out.join(" ");
}

function push(input: ClassValue, out: string[]): void {
  if (!input) return;
  if (typeof input === "string" || typeof input === "number") {
    out.push(String(input));
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) push(item, out);
    return;
  }
  if (typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      if (value) out.push(key);
    }
  }
}

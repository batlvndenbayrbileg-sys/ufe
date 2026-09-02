/** Find a marker comment in text → its character range (pure, testable). */
export function findMarker(text: string, marker: string): { from: number; to: number } | null {
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  return { from: idx, to: idx + marker.length };
}

export interface Range {
  from: number;
  to: number;
}

/** Whether a change spanning [from,to) intersects any protected range. */
export function intersectsRange(from: number, to: number, ranges: Range[]): boolean {
  for (const r of ranges) {
    if (from < r.to && to > r.from) return true;
  }
  return false;
}

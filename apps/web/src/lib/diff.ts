export type DiffType = "same" | "add" | "del";
export interface DiffOp {
  type: DiffType;
  text: string;
}

/**
 * Line-based diff (LCS) between the student's code (`mine`) and the reference
 * solution (`answer`). `del` = a line you wrote that the answer doesn't have;
 * `add` = a line the answer has that you're missing. Files here are tiny
 * (lesson snippets), so the O(n·m) table is fine.
 */
export function lineDiff(mine: string, answer: string): DiffOp[] {
  const A = mine.replace(/\r\n/g, "\n").replace(/\s+$/, "").split("\n");
  const B = answer.replace(/\r\n/g, "\n").replace(/\s+$/, "").split("\n");
  const n = A.length;
  const m = B.length;

  // LCS length table.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = A[i] === B[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const out: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ type: "del", text: A[i]! });
      i++;
    } else {
      out.push({ type: "add", text: B[j]! });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: A[i++]! });
  while (j < m) out.push({ type: "add", text: B[j++]! });
  return out;
}

/** Whether two sources differ once trailing whitespace is ignored. */
export function differs(a: string, b: string): boolean {
  return a.replace(/\r\n/g, "\n").replace(/\s+$/, "") !== b.replace(/\r\n/g, "\n").replace(/\s+$/, "");
}

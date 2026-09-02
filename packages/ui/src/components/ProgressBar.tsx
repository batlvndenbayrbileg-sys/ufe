import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
  tone?: "accent" | "success" | "xp";
  label?: string;
}

export function ProgressBar({ value, className, tone = "accent", label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const style = { "--pb-value": `${clamped}%` } as CSSProperties;
  return (
    <div
      className={cn(styles.track, className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn(styles.fill, styles[tone])} style={style} />
    </div>
  );
}

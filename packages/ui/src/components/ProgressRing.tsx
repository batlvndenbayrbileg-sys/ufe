import { cn } from "../lib/cn";
import styles from "./ProgressRing.module.css";

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  className,
  showLabel = true,
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  return (
    <div
      className={cn(styles.wrap, className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Явц"}
    >
      <svg width={size} height={size} className={styles.svg}>
        <circle
          className={styles.trackCircle}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className={styles.valueCircle}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showLabel ? (
        <span className={styles.label} style={{ fontSize: size * 0.26 }}>
          {Math.round(clamped)}%
        </span>
      ) : null}
    </div>
  );
}

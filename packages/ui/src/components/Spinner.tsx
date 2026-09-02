import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: number | string;
  className?: string;
  /** Accessible label; omit for a purely decorative spinner inside a labelled control. */
  label?: string;
}

export function Spinner({ size = 16, className, label }: SpinnerProps) {
  const style = { "--spinner-size": typeof size === "number" ? `${size}px` : size } as CSSProperties;
  return (
    <span
      className={cn(styles.spinner, className)}
      style={style}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

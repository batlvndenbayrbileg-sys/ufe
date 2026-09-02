"use client";

import { cn } from "../lib/cn";
import styles from "./Switch.module.css";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      data-state={checked ? "on" : "off"}
      className={cn(styles.switch, className)}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  );
}

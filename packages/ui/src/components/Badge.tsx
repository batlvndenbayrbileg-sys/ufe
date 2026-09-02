import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
}

export function Badge({ tone = "neutral", size = "sm", className, ...rest }: BadgeProps) {
  return <span className={cn(styles.badge, styles[tone], styles[size], className)} {...rest} />;
}

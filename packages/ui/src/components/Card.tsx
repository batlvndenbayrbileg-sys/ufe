import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
  interactive?: boolean;
  padded?: boolean;
}

export function Card({
  as: Tag = "div",
  interactive = false,
  padded = true,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(styles.card, interactive && styles.interactive, padded && styles.padded, className)}
      {...rest}
    />
  );
}

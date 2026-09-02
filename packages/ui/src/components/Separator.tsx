import { cn } from "../lib/cn";
import styles from "./Separator.module.css";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Separator({ orientation = "horizontal", className }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(styles.sep, styles[orientation], className)}
    />
  );
}

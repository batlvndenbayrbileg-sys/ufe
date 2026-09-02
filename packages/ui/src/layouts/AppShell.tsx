import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./AppShell.module.css";

export interface AppShellProps {
  /** Top bar content (brand, nav, streak, avatar). */
  header?: ReactNode;
  children: ReactNode;
  /** Constrain the content column width. Defaults to true (1180px). */
  contained?: boolean;
  className?: string;
}

export function AppShell({ header, children, contained = true, className }: AppShellProps) {
  return (
    <div className={cn(styles.shell, className)}>
      {header ? (
        <header className={styles.header}>
          <div className={cn(styles.headerInner, contained && styles.contained)}>{header}</div>
        </header>
      ) : null}
      <main className={styles.main}>
        <div className={cn(contained && styles.contained)}>{children}</div>
      </main>
    </div>
  );
}

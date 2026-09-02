import type { ReactNode } from "react";
import styles from "./AuthShell.module.css";

export interface AuthShellProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  brand?: ReactNode;
}

export function AuthShell({ children, title, subtitle, footer, brand }: AuthShellProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {brand ? <div className={styles.brand}>{brand}</div> : null}
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}

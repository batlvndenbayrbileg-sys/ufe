import type { ReactNode } from "react";
import styles from "./AuthShell.module.css";

export interface AuthShellProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  brand?: ReactNode;
  /** Optional decorative/marketing panel shown beside the form on wide screens. */
  aside?: ReactNode;
}

export function AuthShell({ children, title, subtitle, footer, brand, aside }: AuthShellProps) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.split} ${aside ? styles.hasAside : ""}`}>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
        <div className={styles.panel}>
          <div className={styles.inner}>
            {brand ? <div className={styles.brand}>{brand}</div> : null}
            {title ? <h1 className={styles.title}>{title}</h1> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            <div className={styles.body}>{children}</div>
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

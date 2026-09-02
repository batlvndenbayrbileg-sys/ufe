import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./Alert.module.css";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: ReactNode;
  icon?: ReactNode;
}

export function Alert({ tone = "info", title, icon, className, children, ...rest }: AlertProps) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(styles.alert, styles[tone], className)}
      {...rest}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <div className={styles.body}>
        {title ? <div className={styles.title}>{title}</div> : null}
        {children ? <div className={styles.desc}>{children}</div> : null}
      </div>
    </div>
  );
}

"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./IconButton.module.css";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only controls must be labelled for screen readers. */
  "aria-label": string;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.iconBtn, styles[variant], styles[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
});

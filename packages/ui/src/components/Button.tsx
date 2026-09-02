"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./Spinner";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled ?? loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className={styles.spinner} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, inputSize = "md", className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(styles.input, styles[inputSize], invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

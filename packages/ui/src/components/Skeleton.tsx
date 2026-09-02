import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

export function Skeleton({ width, height = 16, radius, className, style, ...rest }: SkeletonProps) {
  const merged: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: typeof radius === "number" ? `${radius}px` : radius,
    ...style,
  };
  return (
    <div aria-hidden className={cn(styles.skeleton, className)} style={merged} {...rest} />
  );
}

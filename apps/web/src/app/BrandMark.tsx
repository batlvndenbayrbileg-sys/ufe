/**
 * The Хийе logomark — the same Х tile as the favicon (app/icon.svg), so the
 * browser tab and the in-app header read as one brand. Decorative; the adjacent
 * "Хийе" wordmark carries the name.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false" style={{ display: "block", flex: "none" }}>
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <path d="M10 9 L22 23 M22 9 L10 23" stroke="var(--on-accent)" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

/** Mark + wordmark, the standard header lockup. */
export function BrandLockup({ size = 26 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <BrandMark size={size} />
      <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>Хийе</strong>
    </span>
  );
}

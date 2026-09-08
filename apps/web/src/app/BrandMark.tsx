/**
 * The Botxon logomark — the robot mascot artwork at public/brand/head.png
 * (500×500, transparent). Decorative; the adjacent "Botxon" wordmark carries
 * the name.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <img
      src="/brand/head.png"
      alt=""
      width={size}
      height={size}
      aria-hidden
      style={{ display: "block", flex: "none", objectFit: "contain" }}
    />
  );
}

/** Mark + wordmark, the standard header lockup. */
export function BrandLockup({ size = 26 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <BrandMark size={size} />
      <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>Botxon</strong>
    </span>
  );
}

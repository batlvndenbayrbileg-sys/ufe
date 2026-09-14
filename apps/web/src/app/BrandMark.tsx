/**
 * UFE ISMD brand. The logo artwork is public/img/showcase/ufe-header.png
 * (the striped mark + "UFE" wordmark). BrandLockup pairs it with "ISMD" so the
 * full product name "UFE ISMD" reads as one wordmark; BrandMark is the logo
 * image alone for tight spots.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <img
      src="/img/showcase/ufe-header.png"
      alt="UFE"
      height={size}
      aria-hidden
      style={{ display: "block", flex: "none", width: "auto", objectFit: "contain" }}
    />
  );
}

/** Logo + "ISMD" → the standard "UFE ISMD" header lockup. */
export function BrandLockup({ size = 24 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <BrandMark size={size} />
      <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>ISMD</strong>
    </span>
  );
}

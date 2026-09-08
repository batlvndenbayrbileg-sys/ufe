/**
 * The Botxon logomark — a little robot mascot: white helmet head, a blue-tipped
 * antenna, blue side pods, and a friendly face. Decorative; the adjacent
 * "Botxon" wordmark carries the name. A soft outline keeps the white shell
 * legible on light backgrounds; the coloured parts carry it on dark ones.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      focusable="false"
      style={{ display: "block", flex: "none" }}
    >
      {/* antenna */}
      <line x1="20" y1="11" x2="20" y2="7" stroke="#f2c53d" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="5" r="2.7" fill="#86dcea" stroke="#3fb6d6" strokeWidth="0.8" />

      {/* side pods */}
      <g>
        <rect x="2.5" y="19" width="6" height="9.5" rx="3" fill="#4db6e8" />
        <circle cx="5.5" cy="23.7" r="1.9" fill="#f4c63e" />
        <circle cx="5.5" cy="23.7" r="0.8" fill="#2b9fd4" />
        <rect x="31.5" y="19" width="6" height="9.5" rx="3" fill="#4db6e8" />
        <circle cx="34.5" cy="23.7" r="1.9" fill="#f4c63e" />
        <circle cx="34.5" cy="23.7" r="0.8" fill="#2b9fd4" />
      </g>

      {/* helmet head */}
      <rect x="6" y="11" width="28" height="24" rx="12" fill="#ffffff" stroke="#e3e3e8" strokeWidth="1.1" />

      {/* face plate */}
      <rect x="11" y="15.5" width="18" height="15.5" rx="7.5" fill="#ffe1c9" />

      {/* blush */}
      <ellipse cx="14.2" cy="26.4" rx="1.9" ry="1.1" fill="#f7a9a0" opacity="0.85" />
      <ellipse cx="25.8" cy="26.4" rx="1.9" ry="1.1" fill="#f7a9a0" opacity="0.85" />

      {/* eyes */}
      <ellipse cx="16.2" cy="23.4" rx="1.8" ry="2.5" fill="#1b1b1b" />
      <ellipse cx="23.8" cy="23.4" rx="1.8" ry="2.5" fill="#1b1b1b" />
      <circle cx="16.8" cy="22.5" r="0.55" fill="#ffffff" />
      <circle cx="24.4" cy="22.5" r="0.55" fill="#ffffff" />

      {/* smile */}
      <path
        d="M17.4 27.2 Q20 29.2 22.6 27.2"
        fill="none"
        stroke="#1b1b1b"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
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

import styles from "./BrandMark.module.css";

/**
 * UFE ISMD brand. The logo artwork is public/img/showcase/ismd-logo.png — the
 * full "iSMD · Information Systems Department" wordmark. Because the artwork is
 * already a complete lockup, BrandMark renders it on its own and BrandLockup is
 * an alias kept so existing header call-sites don't have to change; neither adds
 * a separate "ISMD" text label any more (that would double the wordmark).
 *
 * `adaptive` knocks the dark-blue artwork out to white in dark mode — used for
 * the app header (dark surface). It's left off on the certificate, whose paper
 * is always white, so the logo stays its branded blue there.
 */
export function BrandMark({ size = 26, adaptive = false }: { size?: number; adaptive?: boolean }) {
  return (
    <img
      src="/img/showcase/ismd-logo.png"
      alt="ISMD — Information Systems Department"
      height={size}
      className={adaptive ? `${styles.logo} ${styles.adaptive}` : styles.logo}
    />
  );
}

/** The "iSMD" wordmark for the app/site header — adapts to dark mode. */
export function BrandLockup({ size = 40 }: { size?: number }) {
  return <BrandMark size={size} adaptive />;
}

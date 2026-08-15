'use client';

/**
 * Background — fixed animated aurora + blurred overlay.
 *
 * Three radial "orbs" drift on infinite CSS paths behind a dark
 * blurred overlay, giving the dashboard a living frosted-glass feel.
 * The overlay keeps glass panels legible over the motion.
 */

export function Background() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>
      <div className="aurora-overlay" aria-hidden="true" />
    </>
  );
}

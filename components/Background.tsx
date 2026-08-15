/**
 * Background — subtle dark backdrop for the HANOON command dashboard.
 *
 * A fine grid over a deep-navy field with two faint radial glows. Keeps
 * panels legible and the UI looking like a pro terminal, not a photo mashup.
 */

export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-hanoon-bg" aria-hidden="true">
      {/* Base radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 500px at 15% -10%, rgba(45,212,191,0.07), transparent 60%),' +
            'radial-gradient(900px 480px at 90% 0%, rgba(96,165,250,0.06), transparent 60%)',
        }}
      />
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 90% 80% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 80% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}

'use client';

/**
 * Background — fixed moving-image backdrop (classic HANOON stack).
 *
 * 1. /bg.jpg stock-market artwork, heavily blurred + zoomed ("moving image")
 * 2. Three animated aurora orbs floating over the photo
 * 3. A dark gradient veil so frosted-glass panels stay legible
 *
 * The whole layer sits behind the content (fixed, -z) and never blocks
 * interaction.
 */

export function Background() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      {/* Blurred stock-market artwork */}
      <img
        src="/bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-70"
      />
      {/* Colourful animated glows over the photo */}
      <div className="aurora-orb w-80 h-80 sm:w-96 sm:h-96 bg-cyan-500/30 -top-24 -left-24" />
      <div
        className="aurora-orb w-96 h-96 sm:w-[30rem] sm:h-[30rem] bg-fuchsia-500/25 top-1/3 -right-32"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="aurora-orb w-80 h-80 sm:w-96 sm:h-96 bg-amber-500/20 bottom-0 left-1/4"
        style={{ animationDelay: '-10s' }}
      />
      {/* Light readability veil — keeps glass cards legible without dimming the colour */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/35 via-fuchsia-950/25 to-slate-950/75" />
    </div>
  );
}

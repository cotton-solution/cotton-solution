/**
 * Very subtle, abstract cotton-boll / botanical mark used as a low-contrast
 * decorative accent on the auth brand panel. Intentionally minimal —
 * geometric shapes only, no stock imagery, no literal illustration —
 * so it supports the SaaS layout instead of competing with it.
 */
export function CottonMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* stem */}
      <path
        d="M80 158V96"
        stroke="#166534"
        strokeOpacity="0.16"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M80 130C68 130 58 122 54 110"
        stroke="#166534"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M80 118C92 118 102 110 106 98"
        stroke="#166534"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* cotton boll — soft overlapping lobes */}
      <circle cx="58" cy="70" r="26" fill="#166534" fillOpacity="0.06" />
      <circle cx="98" cy="66" r="28" fill="#166534" fillOpacity="0.05" />
      <circle cx="78" cy="42" r="24" fill="#166534" fillOpacity="0.07" />
      <circle cx="78" cy="76" r="22" fill="#F0FDF4" fillOpacity="0.9" />

      {/* single amber accent — used sparingly, as specified */}
      <circle cx="112" cy="44" r="4" fill="#F59E0B" fillOpacity="0.45" />
    </svg>
  );
}

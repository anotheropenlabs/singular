// Singular brand mark — "Irregular Singularity"
//
// Five concentric shapes, each deliberately irregular:
//   - different ellipse centers (offset 1-2px each direction)
//   - different aspect ratios (rx ≠ ry, no two rings share same ratio)
//   - spacing accelerates toward center (gravity effect)
//   - opacity and weight increase inward
//
// Net effect: an asymmetric gravitational well — organic, not mechanical.

import { cn } from '@/lib/utils';

interface SingularLogoProps {
  size?: number;
  className?: string;
}

export default function SingularLogo({ size = 28, className }: SingularLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="Singular"
    >
      <defs>
        <linearGradient id="sl-grad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <radialGradient id="sg-bloom" cx="52%" cy="48%" r="50%">
          <stop offset="0%"   stopColor="#60A5FA" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ring 1 — outer, tilted wide ellipse, shifted up-right */}
      <ellipse cx="14.8" cy="13.4" rx="12.6" ry="10.8"
        stroke="url(#sl-grad)" strokeWidth="0.65" strokeOpacity="0.20"
        transform="rotate(-12 14.8 13.4)" />

      {/* Ring 2 — medium, squat ellipse, shifted slightly left */}
      <ellipse cx="13.6" cy="14.2" rx="9.4" ry="8.2"
        stroke="url(#sl-grad)" strokeWidth="0.8" strokeOpacity="0.35"
        transform="rotate(8 13.6 14.2)" />

      {/* Ring 3 — rounder but still off-center */}
      <ellipse cx="14.5" cy="13.7" rx="6.3" ry="6.9"
        stroke="url(#sl-grad)" strokeWidth="0.95" strokeOpacity="0.55"
        transform="rotate(-5 14.5 13.7)" />

      {/* Ring 4 — tight, slightly tall */}
      <ellipse cx="14.0" cy="13.5" rx="3.9" ry="4.6"
        stroke="url(#sl-grad)" strokeWidth="1.1" strokeOpacity="0.75"
        transform="rotate(14 14.0 13.5)" />

      {/* Ring 5 — near core, slightly wide */}
      <ellipse cx="14.2" cy="14.1" rx="2.4" ry="2.0"
        stroke="url(#sl-grad)" strokeWidth="1.15" strokeOpacity="0.88"
        transform="rotate(-20 14.2 14.1)" />

      {/* Bloom glow */}
      <circle cx="14" cy="14" r="3.2" fill="url(#sg-bloom)" />

      {/* Core singularity point */}
      <circle cx="14" cy="14" r="1.35" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

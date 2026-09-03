import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export function BrandLogo({ className = '', size = 36 }: BrandLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="gnt-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="gnt-grad-core" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <radialGradient id="gnt-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Hex/Rounded Shield Background */}
        <rect width="64" height="64" rx="18" fill="url(#gnt-grad-bg)" />

        {/* Ambient Dark Overlay to accentuate icon contrast */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill="#090d16" fillOpacity="0.45" />

        {/* Radial Center Glow */}
        <circle cx="32" cy="32" r="22" fill="url(#gnt-glow)" />

        {/* Submersible Impeller Blades & Hydro Turbine Vortex */}
        <g transform="translate(32, 32)">
          {/* Outer Ring */}
          <circle cx="0" cy="0" r="20" stroke="url(#gnt-grad-core)" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

          {/* 4 Curved Impeller Vanes */}
          <path
            d="M 0 -6 C 8 -16, 16 -12, 18 -4 C 13 -2, 6 -3, 0 -6 Z"
            fill="url(#gnt-grad-core)"
          />
          <path
            d="M 6 0 C 16 8, 12 16, 4 18 C 2 13, 3 6, 6 0 Z"
            fill="url(#gnt-grad-core)"
            opacity="0.9"
          />
          <path
            d="M 0 6 C -8 16, -16 12, -18 4 C -13 2, -6 3, 0 6 Z"
            fill="url(#gnt-grad-core)"
            opacity="0.8"
          />
          <path
            d="M -6 0 C -16 -8, -12 -16, -4 -18 C -2 -13, -3 -6, -6 0 Z"
            fill="url(#gnt-grad-core)"
            opacity="0.9"
          />

          {/* Central Motor Shaft & High-Pressure Core */}
          <circle cx="0" cy="0" r="6" fill="#ffffff" />
          <circle cx="0" cy="0" r="3" fill="#047857" />

          {/* Water Flow Dynamic Jets */}
          <circle cx="0" cy="-14" r="1.5" fill="#38bdf8" />
          <circle cx="14" cy="0" r="1.5" fill="#38bdf8" />
          <circle cx="0" cy="14" r="1.5" fill="#38bdf8" />
          <circle cx="-14" cy="0" r="1.5" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
}

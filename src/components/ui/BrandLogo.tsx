'use client';

import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export function BrandLogo({ className = '', size = 36 }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-emerald-500/25 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id={`blade-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="35%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id={`accent-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
        </defs>

        {/* Shield Background with high-contrast emerald bevel */}
        <rect width="64" height="64" rx="16" fill={`url(#bg-${uid})`} />
        <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Submersible Pump Outer Diffuser Ring */}
        <circle cx="32" cy="32" r="23" stroke="#a7f3d0" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="32" cy="32" r="21" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />

        {/* 6 Curved High-Pressure Impeller Fan Blades */}
        <g transform="translate(32, 32)">
          {/* Blade 1 (0 deg) */}
          <path
            d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
            fill={`url(#blade-${uid})`}
          />
          {/* Blade 2 (60 deg) */}
          <g transform="rotate(60)">
            <path
              d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
              fill={`url(#blade-${uid})`}
            />
          </g>
          {/* Blade 3 (120 deg) */}
          <g transform="rotate(120)">
            <path
              d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
              fill={`url(#blade-${uid})`}
            />
          </g>
          {/* Blade 4 (180 deg) */}
          <g transform="rotate(180)">
            <path
              d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
              fill={`url(#blade-${uid})`}
            />
          </g>
          {/* Blade 5 (240 deg) */}
          <g transform="rotate(240)">
            <path
              d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
              fill={`url(#blade-${uid})`}
            />
          </g>
          {/* Blade 6 (300 deg) */}
          <g transform="rotate(300)">
            <path
              d="M 0 -4 C 10 -15, 20 -10, 18 0 C 13 -1, 6 -1, 0 -4 Z"
              fill={`url(#blade-${uid})`}
            />
          </g>

          {/* Center Impeller Bearing & Motor Hub */}
          <circle cx="0" cy="0" r="7" fill="#064e3b" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
          <circle cx="0" cy="0" r="2" fill="#047857" />
        </g>
      </svg>
    </div>
  );
}

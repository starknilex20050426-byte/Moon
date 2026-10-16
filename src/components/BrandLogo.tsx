import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showTagline = true,
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? 'text-white' : 'text-neutral-900';
  const subtextColor = isLight ? 'text-neutral-300' : 'text-neutral-800';

  const scaleMap = {
    sm: { scriptSize: 'text-2xl', taglineSize: 'text-[9px] tracking-[0.26em]', gap: 'gap-0.5' },
    md: { scriptSize: 'text-3xl md:text-4xl', taglineSize: 'text-[10px] md:text-[11px] tracking-[0.28em]', gap: 'gap-1' },
    lg: { scriptSize: 'text-5xl md:text-6xl', taglineSize: 'text-xs md:text-sm tracking-[0.32em]', gap: 'gap-1.5' },
  };

  const currentScale = scaleMap[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${currentScale.gap} ${className}`}>
      {/* Script Calligraphy Logotype mimicking the hand-painted brush style */}
      <div className="flex items-center justify-center relative">
        <svg
          viewBox="0 0 240 85"
          className={size === 'sm' ? 'w-24 h-9' : size === 'md' ? 'w-32 md:w-36 h-12 md:h-14' : 'w-48 md:w-56 h-18 md:h-22'}
          fill={isLight ? '#FFFFFF' : '#0F0F10'}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Custom vector brush path for "Moon" matching the uploaded logo */}
          {/* Letter M: tall energetic brush downstroke and dual energetic humps */}
          <path d="M 28 80 C 24 75, 20 40, 22 25 C 23 18, 27 10, 31 10 C 35 10, 41 22, 45 36 C 48 45, 50 56, 52 56 C 54 56, 61 24, 69 18 C 74 14, 80 15, 81 24 C 82 34, 76 60, 73 75 C 72 79, 68 81, 65 77 C 62 72, 65 52, 68 36 C 69 31, 66 26, 62 30 C 56 36, 47 62, 42 62 C 38 62, 33 46, 31 35 C 30 42, 28 65, 26 78 Z" />
          {/* Letter o (first): fluid circular loop */}
          <path d="M 98 42 C 90 42, 83 48, 83 58 C 83 68, 92 76, 103 76 C 114 76, 122 68, 122 57 C 122 47, 113 42, 98 42 Z M 101 49 C 109 49, 114 54, 114 59 C 114 65, 108 70, 102 70 C 96 70, 91 65, 91 58 C 91 52, 95 49, 101 49 Z" />
          {/* Connection stroke from o to second o */}
          <path d="M 116 52 C 123 48, 131 43, 140 43 C 138 46, 134 49, 129 52 Z" />
          {/* Letter o (second): slightly higher brush stroke */}
          <path d="M 144 42 C 135 42, 128 48, 128 58 C 128 68, 137 76, 148 76 C 159 76, 167 67, 167 56 C 167 46, 158 42, 144 42 Z M 146 49 C 154 49, 159 54, 159 59 C 159 65, 153 70, 147 70 C 141 70, 136 65, 136 58 C 136 52, 140 49, 146 49 Z" />
          {/* Letter n with expressive calligraphy flick */}
          <path d="M 169 44 C 172 44, 175 48, 175 54 C 175 62, 173 70, 171 76 C 169 80, 166 79, 166 75 C 168 67, 173 50, 180 44 C 186 39, 195 40, 199 46 C 205 53, 203 67, 204 74 C 205 80, 212 80, 217 76 C 221 72, 225 67, 227 63 C 225 64, 220 69, 216 71 C 213 72, 211 69, 211 65 C 211 57, 208 47, 200 42 C 193 37, 183 40, 178 45 Z" />
        </svg>
      </div>

      {/* Tracked Tagline: KEEP IT STYLISH */}
      {showTagline && (
        <span
          className={`font-semibold uppercase tracking-[0.28em] text-center ${currentScale.taglineSize} ${subtextColor}`}
          style={{ letterSpacing: '0.3em' }}
        >
          KEEP IT STYLISH
        </span>
      )}
    </div>
  );
};

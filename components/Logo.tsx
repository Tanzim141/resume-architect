import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 16, title: 'text-sm sm:text-base', sub: 'text-[8px]' },
    md: { box: 'w-8 h-8 sm:w-9 sm:h-9', icon: 20, title: 'text-base sm:text-lg', sub: 'text-[9px] sm:text-[10px]' },
    lg: { box: 'w-10 h-10 sm:w-11 sm:h-11', icon: 24, title: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-[11px]' },
    xl: { box: 'w-12 h-12 sm:w-14 sm:h-14', icon: 28, title: 'text-xl sm:text-2xl', sub: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 min-w-0 shrink ${className}`}>
      {/* Standard White-Canvas Architectural Brand Mark */}
      <div className={`relative ${current.box} rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden`}>
        {/* Subtle architectural grid pattern in background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-white dark:from-slate-800 dark:to-slate-900 pointer-events-none" />
        
        {/* Clean, Modern Architectural Monogram Mark */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 relative z-10"
        >
          <defs>
            <linearGradient id="ra-grad-primary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="ra-grad-accent" x1="16" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>

          {/* Background Soft Glow */}
          <rect x="2" y="2" width="28" height="28" rx="8" fill="#f0f9ff" className="dark:fill-sky-950/40" />

          {/* Left Vertical Pillar / Spine (forming R/A foundation) */}
          <path 
            d="M8 7C8 5.89543 8.89543 5 10 5H13C14.1046 5 15 5.89543 15 7V25C15 26.1046 14.1046 27 13 27H10C8.89543 27 8 26.1046 8 25V7Z" 
            fill="url(#ra-grad-primary)" 
          />

          {/* Upper Architectural Curve / Page Header (forming the 'R' loop and 'A' apex) */}
          <path 
            d="M15 5H21C23.7614 5 26 7.23858 26 10C26 12.7614 23.7614 15 21 15H15V5Z" 
            fill="url(#ra-grad-accent)" 
          />

          {/* Inner Negative Space Cutout */}
          <circle cx="20.5" cy="10" r="2.2" fill="white" className="dark:fill-slate-800" />

          {/* Dynamic Architectural Strut / Forward Angle (forming the R leg / A cross-strut) */}
          <path 
            d="M16 14.5L24.2 25.4C24.7 26.1 24.2 27 23.3 27H18.8C18.3 27 17.8 26.7 17.5 26.3L12.5 19.5" 
            fill="#0284c7" 
            className="dark:fill-sky-400"
          />

          {/* Precision Dot Accent */}
          <circle cx="24.5" cy="7" r="1.5" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center tracking-tight truncate">
          <span className={`${current.title} font-extrabold text-slate-900 dark:text-white tracking-tight leading-none`}>
            Resume
          </span>
          <span className={`${current.title} font-extrabold text-sky-600 dark:text-sky-400 tracking-tight leading-none ml-1 sm:ml-1.5`}>
            Architect
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

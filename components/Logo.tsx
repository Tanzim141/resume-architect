import React from 'react';
import logoImg from '../src/assets/images/resume_architect_logo_1790014367457.jpg';

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
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
    xl: 'w-12 h-12 sm:w-16 sm:h-16',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-xl',
    lg: 'text-lg sm:text-2xl',
    xl: 'text-xl sm:text-3xl',
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      {/* Premium Logo Badge */}
      <div className={`relative ${sizeClasses[size]} rounded-lg sm:rounded-xl overflow-hidden shadow-sm ring-1 ring-sky-500/20 bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center shrink-0 group`}>
        <img 
          src={logoImg} 
          alt="Resume Architect Logo" 
          className="w-full h-full object-cover rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-white/15 pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center tracking-tight">
            <span className={`${textSizes[size]} font-extrabold text-slate-900 dark:text-white tracking-tight leading-none`}>
              Resume
            </span>
            <span className={`${textSizes[size]} font-extrabold text-sky-600 dark:text-sky-400 tracking-tight leading-none ml-1 sm:ml-1.5`}>
              Architect
            </span>
          </div>
          {size !== 'sm' && (
            <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
              AI Powered CV Builder
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  }[variant];

  return (
    <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children }) => {
  const variantStyles = {
    success: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    warning: 'bg-amber-950 text-amber-400 border-amber-800',
    info: 'bg-blue-950 text-blue-400 border-blue-800',
    danger: 'bg-rose-950 text-rose-400 border-rose-800',
    neutral: 'bg-slate-900 text-slate-300 border-slate-700',
  }[variant];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${variantStyles}`}>
      {children}
    </span>
  );
};

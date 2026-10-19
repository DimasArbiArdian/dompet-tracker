import React from 'react';

const variantClasses = {
  coral:
    'bg-brand-coral text-white border-2 border-ink shadow-tactile-coral hover:brightness-105',
  teal:
    'bg-brand-teal text-white border-2 border-ink shadow-tactile-teal hover:brightness-105',
  mint:
    'bg-brand-mint text-ink border-2 border-ink shadow-tactile hover:brightness-95',
  cream:
    'bg-brand-cream text-ink border-2 border-ink shadow-tactile hover:brightness-95',
  outline:
    'bg-white text-ink border-2 border-ink shadow-tactile hover:bg-surface-bg',
  ghost:
    'bg-transparent text-ink hover:bg-black/5 border-transparent shadow-none',
  danger:
    'bg-red-500 text-white border-2 border-ink shadow-tactile hover:bg-red-600',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3 text-base font-bold rounded-xl gap-2.5',
};

const TactileButton = ({
  children,
  variant = 'coral',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-sans select-none tracking-tight transition-all duration-75 active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-tactile ${
        variantClasses[variant] || variantClasses.coral
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
      ) : null}
      {children}
    </button>
  );
};

export default TactileButton;

import React, { Fragment, ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-900/20',
      secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600 border border-slate-700',
      ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
      danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
      outline: 'bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

interface CardProps extends HTMLAttributes<HTMLDivElement> { }

export const Card = ({ className, children, ...props }: CardProps) => (
  <div className={cn('bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm', className)} {...props}>
    {children}
  </div>
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary';
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
    outline: 'bg-transparent border-slate-700 text-slate-400',
    secondary: 'bg-slate-800/50 text-slate-400 border-slate-700/50',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export const Avatar = ({ className, src, alt, fallback, ...props }: AvatarProps) => {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props}>
      {src ? (
        <img className="aspect-square h-full w-full" src={src} alt={alt} />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800">
          {fallback}
        </div>
      )}
    </div>
  )
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-[#141820] border border-slate-800 rounded-xl shadow-2xl outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 rounded-t">
            <h3 className="text-xl font-semibold text-slate-100">
              {title}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-slate-400 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-slate-100 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

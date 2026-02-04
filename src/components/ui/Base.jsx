import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-900/20',
        secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600 border border-slate-700',
        ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
        danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    return (<button ref={ref} className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props}/>);
});
export const Card = ({ className, children, ...props }) => (<div className={cn('bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm', className)} {...props}>
    {children}
  </div>);
export const Badge = ({ className, variant = 'default', children }) => {
    const variants = {
        default: 'bg-slate-800 text-slate-300 border-slate-700',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (<span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>);
};


import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'icon';
    active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    variant = 'secondary', 
    size = 'md', 
    active, 
    className, 
    children, 
    ...props 
}) => {
    // Changed rounded-xl to rounded-md
    const baseClass = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        // Darkened secondary text and hover states
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent",
        ghost: clsx("hover:bg-slate-100", active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"),
        icon: clsx("hover:bg-slate-100", active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-900")
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 h-8 gap-2",
        md: "text-sm px-4 py-2 h-9 gap-2", // Reduced height slightly for tighter UI
        icon: "w-8 h-8 p-0"
    };

    return (
        <button 
            className={clsx(baseClass, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};

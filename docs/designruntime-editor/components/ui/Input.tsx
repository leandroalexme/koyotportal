
import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label?: string;
}

export const Input: React.FC<InputProps> = ({ icon, className, label, ...props }) => {
    return (
        <div className="flex-1 min-w-0">
            {/* Darkened label text */}
            {label && <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
            <div className="relative group">
                {/* Darkened icon color */}
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-colors group-focus-within:text-slate-700">{icon}</div>}
                <input 
                    className={clsx(
                        // rounded-md, darkened bg slightly for contrast against white
                        "flex w-full rounded-md bg-slate-100 text-sm font-medium text-slate-900 transition-all border border-transparent",
                        "placeholder:text-slate-500",
                        "focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        props.type === 'number' ? "text-right font-mono" : "",
                        icon ? "pl-9 pr-3 py-2" : "px-3 py-2",
                        className
                    )}
                    {...props} 
                />
            </div>
        </div>
    );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ className, label, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
            <div className="relative">
                <select 
                    className={clsx(
                        "flex w-full appearance-none rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition-all border border-transparent",
                        "focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100",
                        "disabled:opacity-50 cursor-pointer hover:bg-slate-200",
                        className
                    )}
                    {...props} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

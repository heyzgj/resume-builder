"use client";

import { clsx } from "clsx";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5 group">
                <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wide transition-colors duration-200 group-focus-within:text-[var(--accent-primary)]">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={clsx(
                        "w-full bg-transparent border-b border-[var(--border-soft)] py-2 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-placeholder)]",
                        "focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-200",
                        "hover:border-[var(--text-muted)]",
                        "disabled:text-[var(--text-muted)] disabled:cursor-not-allowed",
                        error && "border-red-400 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <span className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";


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
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider transition-colors group-focus-within:text-neutral-800">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={clsx(
                        "w-full bg-transparent border-b border-neutral-200 py-1.5 text-sm font-medium text-neutral-900 placeholder-transparent focus:outline-none focus:border-neutral-900 transition-colors",
                        "disabled:text-neutral-400 disabled:cursor-not-allowed",
                        error && "border-red-500 focus:border-red-500",
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

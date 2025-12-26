"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

interface SectionWrapperProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onTitleChange?: (newTitle: string) => void;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, children, defaultOpen = false, onTitleChange }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleTitleSave = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onTitleChange && tempTitle.trim()) {
            onTitleChange(tempTitle);
        }
        setIsEditing(false);
    };

    return (
        <div className="border border-neutral-100 rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md group">
            <div
                onClick={() => !isEditing && setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
                <div onClick={(e) => e.stopPropagation()} className="flex-1">
                    {isEditing ? (
                        <form onSubmit={handleTitleSave} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="text-xs font-bold uppercase tracking-widest text-neutral-900 bg-white border border-neutral-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-neutral-400 w-full max-w-[200px]"
                                autoFocus
                                onBlur={handleTitleSave}
                            />
                        </form>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</span>
                            {onTitleChange && (
                                <button
                                    onClick={() => {
                                        setTempTitle(title);
                                        setIsEditing(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400 hover:text-neutral-600 underline"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <ChevronDown
                    size={16}
                    className={clsx("text-neutral-400 transition-transform duration-200 ml-4", isOpen && "rotate-180")}
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 border-t border-neutral-100 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

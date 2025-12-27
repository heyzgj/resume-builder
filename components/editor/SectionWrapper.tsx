"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface SectionWrapperProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onTitleChange?: (newTitle: string) => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
    title,
    children,
    defaultOpen = false,
    onTitleChange,
    onDelete,
    canDelete = true
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTitleSave = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onTitleChange && tempTitle.trim()) {
            onTitleChange(tempTitle);
        }
        setIsEditing(false);
    };

    return (
        <div
            className={clsx(
                "relative rounded-xl bg-[var(--card-surface)] transition-all duration-200",
                "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
                "hover:-translate-y-0.5",
                "group"
            )}
        >
            {/* Left Accent Line */}
            <div
                className={clsx(
                    "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-200",
                    isOpen
                        ? "bg-[var(--accent-primary)]"
                        : "bg-[var(--accent-muted)] group-hover:bg-[var(--accent-primary)]"
                )}
            />

            {/* Header - clicking anywhere expands/collapses */}
            <div
                onClick={() => !isEditing && setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 px-5 pl-4 hover:bg-[var(--bg-warm)] transition-colors cursor-pointer rounded-t-xl"
            >

                <div onClick={(e) => e.stopPropagation()} className="flex-1">
                    {isEditing ? (
                        <form onSubmit={handleTitleSave} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="text-sm font-semibold text-[var(--text-primary)] bg-white border border-[var(--border-soft)] rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] w-full max-w-[200px]"
                                autoFocus
                                onBlur={handleTitleSave}
                            />
                        </form>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-secondary)] tracking-tight">{title}</span>
                            {onTitleChange && (
                                <button
                                    onClick={() => {
                                        setTempTitle(title);
                                        setIsEditing(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] font-medium"
                                >
                                    编辑
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Block Menu */}
                    {canDelete && onDelete && (
                        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-warm-subtle)] rounded-md transition-all"
                            >
                                <MoreHorizontal size={14} />
                            </button>

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[var(--border-soft)] py-1 min-w-[140px] z-50"
                                    >
                                        <button
                                            onClick={() => {
                                                onDelete();
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                            删除模块
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <ChevronDown
                        size={16}
                        className={clsx(
                            "text-[var(--text-muted)] transition-all duration-200",
                            isOpen && "rotate-180 text-[var(--accent-primary)]"
                        )}
                    />
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pl-6 pb-5 pt-1 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

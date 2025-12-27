"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface BulletEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minRows?: number;
}

/**
 * BulletEditor - A Notion-style bullet point editor
 * 
 * Users type plain text, one bullet per line.
 * The component automatically prepends bullets on display and handles
 * Enter key for new bullet points.
 * 
 * Storage format: Plain text with newlines (no bullets stored)
 * Display format: Each line prefixed with a bullet (•)
 */
export const BulletEditor: React.FC<BulletEditorProps> = ({
    value,
    onChange,
    placeholder = "输入内容，每行自动添加bullet...",
    minRows = 3
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Parse HTML list format to plain text lines
    const parseHtmlToLines = (html: string): string[] => {
        // Check if it's HTML format (contains <li> tags)
        if (html.includes("<li>")) {
            // Extract text from <li> tags
            const liRegex = /<li>(.*?)<\/li>/gi;
            const matches = [];
            let match;
            while ((match = liRegex.exec(html)) !== null) {
                matches.push(match[1].trim());
            }
            return matches.filter(line => line.length > 0);
        }
        // Otherwise treat as plain text with newlines
        return html.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    };

    // Convert stored text (plain or HTML) to display format with bullets
    const toDisplayFormat = (text: string): string => {
        if (!text) return "";
        const lines = parseHtmlToLines(text);
        return lines.map(line => {
            // Remove any existing bullet characters
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
            return cleanLine.length > 0 ? `• ${cleanLine}` : "";
        }).filter(l => l.length > 0).join("\n");
    };

    // Convert display format (with bullets) back to plain text for storage
    const toStorageFormat = (displayText: string): string => {
        return displayText
            .split("\n")
            .map(line => line.replace(/^[•\-\*]\s*/, "").trim())
            .filter(line => line.length > 0)
            .join("\n");
    };

    const [displayValue, setDisplayValue] = useState(() => toDisplayFormat(value));

    // Sync display value when external value changes
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(toDisplayFormat(value));
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDisplayValue = e.target.value;
        setDisplayValue(newDisplayValue);

        // Convert to storage format and update parent
        const storageValue = toStorageFormat(newDisplayValue);
        onChange(storageValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const cursorPos = textarea.selectionStart;
            const textBefore = displayValue.slice(0, cursorPos);
            const textAfter = displayValue.slice(cursorPos);

            // Add new line with bullet
            const newDisplayValue = textBefore + "\n• " + textAfter;
            setDisplayValue(newDisplayValue);

            // Update storage
            onChange(toStorageFormat(newDisplayValue));

            // Move cursor after the new bullet
            setTimeout(() => {
                textarea.selectionStart = cursorPos + 3;
                textarea.selectionEnd = cursorPos + 3;
            }, 0);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        // If empty, start with a bullet
        if (!displayValue) {
            setDisplayValue("• ");
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Clean up the display value
        const cleaned = toDisplayFormat(toStorageFormat(displayValue));
        setDisplayValue(cleaned);
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wide">
                工作描述
            </label>
            <textarea
                ref={textareaRef}
                className={clsx(
                    "w-full bg-[var(--card-surface)] border rounded-lg p-3 text-xs font-medium text-[var(--text-primary)]",
                    "focus:outline-none transition-all duration-200 min-h-[100px] leading-relaxed resize-y",
                    "placeholder:text-[var(--text-muted)] placeholder:text-xs",
                    isFocused
                        ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-subtle)]"
                        : "border-[var(--border-soft)]"
                )}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                rows={minRows}
            />
        </div>
    );
};

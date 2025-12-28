"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { clsx } from "clsx";
import { Bold, Italic, List, ListOrdered, IndentDecrease, IndentIncrease } from "lucide-react";
import { useEffect, useCallback } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}

const ToolbarButton = ({ onClick, active, disabled, children, title }: ToolbarButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={clsx(
            "p-1.5 rounded-md transition-all duration-150",
            active
                ? "bg-[var(--accent-subtle)] text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-warm)]",
            disabled && "opacity-40 cursor-not-allowed"
        )}
    >
        {children}
    </button>
);

const ToolbarDivider = () => (
    <div className="w-px h-4 bg-[var(--border-soft)] mx-1" />
);

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = "输入内容...",
    className
}: RichTextEditorProps) => {
    const editor = useEditor({
        immediatelyRender: false, // Prevent SSR hydration mismatches
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                blockquote: false,
                horizontalRule: false,
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: clsx(
                    "prose prose-sm max-w-none min-h-[100px] px-3 py-2 focus:outline-none",
                    "text-[var(--text-primary)] text-sm leading-relaxed",
                    "[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-1",
                    "[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-1",
                    "[&>ul>li]:my-0.5 [&>ol>li]:my-0.5",
                    "[&>p]:my-1",
                    "[&_.is-editor-empty:first-child::before]:text-[var(--text-muted)] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none"
                ),
            },
        },
        onUpdate: ({ editor }) => {
            // Get HTML but avoid empty paragraph
            const html = editor.getHTML();
            const isEmpty = html === '<p></p>' || html === '';
            onChange(isEmpty ? '' : html);
        },
    });

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    const handleIndent = useCallback(() => {
        if (!editor) return;
        // For list items, sink them (increase nesting)
        if (editor.isActive('listItem')) {
            editor.chain().focus().sinkListItem('listItem').run();
        }
    }, [editor]);

    const handleOutdent = useCallback(() => {
        if (!editor) return;
        // For list items, lift them (decrease nesting)
        if (editor.isActive('listItem')) {
            editor.chain().focus().liftListItem('listItem').run();
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={clsx(
            "border border-[var(--border-soft)] rounded-xl overflow-hidden bg-white",
            "focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]",
            "transition-all duration-200",
            className
        )}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-softer)] bg-[var(--bg-canvas)]">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="粗体 (⌘B)"
                >
                    <Bold size={14} strokeWidth={2.5} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="斜体 (⌘I)"
                >
                    <Italic size={14} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="无序列表"
                >
                    <List size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="有序列表"
                >
                    <ListOrdered size={14} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Indentation */}
                <ToolbarButton
                    onClick={handleOutdent}
                    disabled={!editor.isActive('listItem')}
                    title="减少缩进"
                >
                    <IndentDecrease size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={handleIndent}
                    disabled={!editor.isActive('listItem')}
                    title="增加缩进"
                >
                    <IndentIncrease size={14} />
                </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
};

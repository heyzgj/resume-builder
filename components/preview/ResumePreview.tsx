"use client";

import { useResumeStore } from "@/lib/store";
import { useSmartFit, getBaseStyles } from "@/lib/smart-fit";
import { clsx } from "clsx";
import { useRef, useState, useEffect } from "react";

/**
 * Convert description text (plain text with newlines OR HTML from RichTextEditor) to display format
 */
const formatDescription = (description: string): React.ReactNode => {
    if (!description) return null;

    // Check if it's HTML format (from TipTap or legacy)
    // TipTap outputs HTML with tags like <p>, <ul>, <li>, <strong>, <em>, etc.
    if (description.includes("<") && description.includes(">")) {
        // Use dangerouslySetInnerHTML for HTML content
        return (
            <div
                className="text-justify text-neutral-800 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol>li]:mb-0.5 [&>p]:my-0.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: description }}
            />
        );
    }

    // Plain text format: split by newlines and render as bullet list
    const lines = description.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return null;

    return (
        <ul className="list-disc pl-4 text-justify text-neutral-800">
            {lines.map((line, index) => (
                <li key={index} className="mb-0.5">{line}</li>
            ))}
        </ul>
    );
};

export const ResumePreview = () => {
    const { data, settings } = useResumeStore();
    const { basics, experience, education, skills } = data;
    const containerRef = useRef<HTMLDivElement>(null);

    // Smart-Fit (on-demand)
    const smartFitResult = useSmartFit(containerRef, data, settings);

    // Get section order with fallback
    const sectionOrder = data.sectionOrder || ['experience', 'education', 'skills'];

    // Render a section based on its key
    const renderSection = (sectionKey: string) => {
        // Experience Section
        if (sectionKey === 'experience') {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.experience || "Professional Experience"}
                    </h2>
                    {experience.length > 0 ? (
                        <div className="space-y-3">
                            {experience.map((job) => (
                                <div key={job.id}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="font-bold text-black">{job.company}</h3>
                                        <span className="text-[9pt] text-neutral-600">{job.location}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p className="italic text-neutral-700">{job.role}</p>
                                        <span className="text-[9pt] text-neutral-600 tabular-nums">{job.startDate} – {job.endDate}</span>
                                    </div>
                                    {formatDescription(job.description)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-400 italic text-sm">点击左侧编辑器添加工作经历...</p>
                    )}
                </section>
            );
        }

        // Education Section
        if (sectionKey === 'education') {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.education || "Education"}
                    </h2>
                    {education.length > 0 ? (
                        <div className="space-y-2">
                            {education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="font-bold text-black">{edu.school}</h3>
                                        <span className="text-[9pt] text-neutral-600">{edu.location}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <div className="text-neutral-700">
                                            <span className="italic">{edu.degree}</span>
                                            {edu.gpa && <span className="not-italic ml-2">• {edu.gpa}</span>}
                                        </div>
                                        <span className="text-[9pt] text-neutral-600 tabular-nums">{edu.startDate} – {edu.endDate}</span>
                                    </div>
                                    {edu.description && formatDescription(edu.description)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-400 italic text-sm">点击左侧编辑器添加教育背景...</p>
                    )}
                </section>
            );
        }

        // Skills Section
        if (sectionKey === 'skills') {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.skills || "Skills & Interests"}
                    </h2>
                    {skills.length > 0 ? (
                        <div className="text-neutral-800">
                            {skills.map((cat) => (
                                <div key={cat.id} className="mb-0.5">
                                    <span className="font-bold text-black">{cat.name}:</span>{" "}
                                    <span>{cat.items.join(", ")}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-400 italic text-sm">点击左侧编辑器添加技能...</p>
                    )}
                </section>
            );
        }

        // Custom Section
        const customSection = data.customSections.find(s => s.id === sectionKey);
        if (customSection) {
            // Check if section has content
            const hasContent =
                (customSection.type === 'summary' && customSection.content) ||
                (customSection.type === 'honors' && customSection.honors && customSection.honors.length > 0) ||
                ((customSection.type === 'portfolio' || customSection.type === 'custom') && customSection.items && customSection.items.length > 0);

            // Get placeholder text based on section type
            const getPlaceholder = () => {
                switch (customSection.type) {
                    case 'summary': return '点击左侧编辑器添加内容...';
                    case 'honors': return '点击左侧编辑器添加荣誉奖项...';
                    case 'portfolio': return '点击左侧编辑器添加项目作品...';
                    default: return '点击左侧编辑器添加内容...';
                }
            };

            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {customSection.title}
                    </h2>

                    {hasContent ? (
                        <>
                            {/* Summary type - plain text paragraph */}
                            {customSection.type === 'summary' && customSection.content && (
                                <p className="text-justify text-neutral-800 leading-relaxed">
                                    {customSection.content}
                                </p>
                            )}

                            {/* Honors type - title | issuer | date format */}
                            {customSection.type === 'honors' && customSection.honors && customSection.honors.length > 0 && (
                                <ul className="list-disc pl-4 text-neutral-800">
                                    {customSection.honors.map((honor) => (
                                        <li key={honor.id} className="mb-1">
                                            <span className="font-bold text-black">{honor.title}</span>
                                            {honor.issuer && <span className="text-neutral-600"> | {honor.issuer}</span>}
                                            {honor.date && <span className="text-neutral-600"> | {honor.date}</span>}
                                            {honor.description && (
                                                <div className="mt-0.5 ml-0 text-neutral-700">
                                                    {formatDescription(honor.description)}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Portfolio/Custom type - experience-like format */}
                            {(customSection.type === 'portfolio' || customSection.type === 'custom') && customSection.items && customSection.items.length > 0 && (
                                <div className="space-y-3">
                                    {customSection.items.map((item) => (
                                        <div key={item.id}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-black">{item.company}</h3>
                                                {item.location && <span className="text-[9pt] text-neutral-600">{item.location}</span>}
                                            </div>
                                            {(item.role || item.startDate) && (
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <p className="italic text-neutral-700">{item.role}</p>
                                                    {item.startDate && (
                                                        <span className="text-[9pt] text-neutral-600 tabular-nums">
                                                            {item.startDate}{item.endDate ? ` – ${item.endDate}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {formatDescription(item.description)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-neutral-400 italic text-sm">{getPlaceholder()}</p>
                    )}
                </section>
            );
        }

        return null;
    };

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="resume-preview bg-white text-neutral-900 mx-auto shadow-lg relative"
                style={{
                    ...smartFitResult.styles,
                    fontFamily: 'var(--font-family-resume)',
                    fontSize: 'var(--font-size-body)',
                    lineHeight: 'var(--line-height-body)',
                    letterSpacing: 'var(--letter-spacing)',
                    padding: 'var(--margin-y) var(--margin-x)',
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header */}
                <header className="text-center mb-5 pb-3">
                    <h1
                        className="font-bold tracking-tight mb-1.5 leading-none"
                        style={{ fontSize: 'var(--font-size-name)' }}
                    >
                        {basics.name}
                    </h1>
                    <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-[9pt] text-neutral-700 tracking-wide">
                        {basics.phone && <span>{basics.phone}</span>}
                        {basics.email && <span className="before:content-['·'] before:mx-2 before:text-neutral-400">{basics.email}</span>}
                        {basics.socials.map((s, i) => (
                            <span key={i} className="before:content-['·'] before:mx-2 before:text-neutral-400">{s.url}</span>
                        ))}
                    </div>
                </header>

                {/* Render sections */}
                {sectionOrder.map(sectionKey => renderSection(sectionKey))}
            </div>

            {/* Page break indicators overlay */}
            <PageBreakOverlay containerRef={containerRef} />
        </div>
    );
};

// Component to show page break overlays
const PageBreakOverlay = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [pageCount, setPageCount] = useState(1);

    useEffect(() => {
        const checkHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.scrollHeight;
                const pageHeight = 297 * 3.7795275591; // 297mm in pixels
                setPageCount(Math.max(1, Math.ceil(height / pageHeight)));
            }
        };

        checkHeight();
        const timeout = setTimeout(checkHeight, 200);
        const observer = new ResizeObserver(checkHeight);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [containerRef]);

    if (pageCount <= 1) return null;

    return (
        <>
            {Array.from({ length: pageCount - 1 }, (_, i) => (
                <div
                    key={i}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                        top: `calc(${(i + 1) * 297}mm)`,
                    }}
                >
                    {/* Page break visual separator */}
                    <div className="relative h-8 bg-neutral-100 border-y border-neutral-300 flex items-center justify-center -mt-4">
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-neutral-400" />
                        <span className="relative bg-neutral-100 px-4 text-xs text-neutral-500 font-medium tracking-wider uppercase">
                            第 {i + 2} 页
                        </span>
                    </div>
                </div>
            ))}
        </>
    );
};

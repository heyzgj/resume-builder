"use client";

import { useResumeStore } from "@/lib/store";
import { useSmartFit, getBaseStyles } from "@/lib/smart-fit";
import { clsx } from "clsx";
import { useRef } from "react";

/**
 * Convert description text (plain text with newlines OR legacy HTML) to display format
 */
const formatDescription = (description: string): React.ReactNode => {
    if (!description) return null;

    // Check if it's legacy HTML format
    if (description.includes("<li>")) {
        // Keep using dangerouslySetInnerHTML for HTML
        return (
            <div
                className="text-justify text-neutral-800 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                dangerouslySetInnerHTML={{ __html: description }}
            />
        );
    }

    // New plain text format: split by newlines and render as bullet list
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
        if (sectionKey === 'experience' && experience.length > 0) {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.experience || "Professional Experience"}
                    </h2>
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
                </section>
            );
        }

        // Education Section
        if (sectionKey === 'education' && education.length > 0) {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.education || "Education"}
                    </h2>
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
                                        {edu.gpa && <span className="not-italic ml-2">• GPA: {edu.gpa}</span>}
                                    </div>
                                    <span className="text-[9pt] text-neutral-600 tabular-nums">{edu.startDate} – {edu.endDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        // Skills Section
        if (sectionKey === 'skills' && skills.length > 0) {
            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {data.sectionTitles?.skills || "Skills & Interests"}
                    </h2>
                    <div className="text-neutral-800">
                        {skills.map((cat) => (
                            <div key={cat.id} className="mb-0.5">
                                <span className="font-bold text-black">{cat.name}:</span>{" "}
                                <span>{cat.items.join(", ")}</span>
                            </div>
                        ))}
                    </div>
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

            if (!hasContent) return null;

            return (
                <section key={sectionKey} className="mb-4">
                    <h2
                        className="font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-3 text-neutral-800"
                        style={{ fontSize: 'var(--font-size-section)' }}
                    >
                        {customSection.title}
                    </h2>

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
                                <li key={honor.id} className="mb-0.5">
                                    <span className="font-bold text-black">{honor.title}</span>
                                    {honor.issuer && <span className="text-neutral-600"> | {honor.issuer}</span>}
                                    {honor.date && <span className="text-neutral-600"> | {honor.date}</span>}
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
                </section>
            );
        }

        return null;
    };

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="resume-preview bg-white text-neutral-900 mx-auto transition-all duration-500 ease-in-out"
                style={{
                    ...smartFitResult.styles,
                    fontFamily: 'var(--font-family-resume)',
                    fontSize: 'var(--font-size-body)',
                    lineHeight: 'var(--line-height-body)',
                    letterSpacing: 'var(--letter-spacing)',
                    padding: 'var(--margin-y) var(--margin-x)',
                    // A4 dimensions - minHeight allows multi-page, CSS handles page breaks
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header - No border underline as per user request */}
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

                {/* Render sections based on sectionOrder */}
                {sectionOrder.map(sectionKey => renderSection(sectionKey))}
            </div>
        </div>
    );
};

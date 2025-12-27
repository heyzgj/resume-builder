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

                {/* Experience */}
                {experience.length > 0 && (
                    <section className="mb-4">
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
                )}

                {/* Education */}
                {education.length > 0 && (
                    <section className="mb-4">
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
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <section>
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
                )}
            </div>
        </div>
    );
};

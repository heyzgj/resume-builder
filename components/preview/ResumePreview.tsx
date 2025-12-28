"use client";

import { useResumeStore } from "@/lib/store";
import { useSmartFit } from "@/lib/smart-fit";
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";

type ResumeBlock = {
    id: string;
    element: React.ReactNode;
    keepWithNext?: boolean;
};

type ResumePreviewProps = {
    onPaginationChange?: (meta: { pageCount: number; lastPageFill: number | null }) => void;
};

const PAGE_WIDTH = "210mm";
const PAGE_HEIGHT = "297mm";
const DEFAULT_SECTION_ORDER = ["experience", "education", "skills"] as const;

const isProbablyHTML = (value: string) => value.includes("<") && value.includes(">");

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const scaleCssLength = (value: string, factor: number) => {
    const match = value.trim().match(/^(-?\d*\.?\d+)([a-z%]+)$/i);
    if (!match) return value;
    const numberValue = Number.parseFloat(match[1]);
    const unit = match[2];
    if (!Number.isFinite(numberValue)) return value;
    const scaled = numberValue * factor;
    const rounded = Math.round(scaled * 1000) / 1000;
    return `${rounded}${unit}`;
};

const getElementOuterHeight = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const marginTop = Number.parseFloat(style.marginTop || "0") || 0;
    const marginBottom = Number.parseFloat(style.marginBottom || "0") || 0;
    return rect.height + marginTop + marginBottom;
};

const pageIdsEqual = (a: string[][], b: string[][]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].length !== b[i].length) return false;
        for (let j = 0; j < a[i].length; j++) {
            if (a[i][j] !== b[i][j]) return false;
        }
    }
    return true;
};

const getDescriptionBlocks = (description: string): React.ReactNode[] => {
    if (!description) return [];

    // Plain text format: split by newlines and render as bullet blocks (breakable).
    if (!isProbablyHTML(description)) {
        const lines = description
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

        return lines.map((line, index) => (
            <ul key={index} className="list-disc pl-4 m-0 text-justify text-neutral-800">
                <li className="m-0">{line}</li>
            </ul>
        ));
    }

    // HTML format (TipTap/legacy): try to split into individual <li> or <p> blocks.
    if (typeof DOMParser === "undefined") {
        return [
            <div
                key="html-fallback"
                className="text-justify text-neutral-800 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:my-0.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: description }}
            />,
        ];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${description}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return [];

    const blocks: React.ReactNode[] = [];
    let blockIndex = 0;
    const nextKey = (prefix: string) => `${prefix}-${blockIndex++}`;
    const richTextClass =
        "text-justify text-neutral-800 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&>p]:my-0.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0";

    const pushParagraph = (html: string) => {
        blocks.push(
            <p
                key={nextKey("p")}
                className="text-justify text-neutral-800 my-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    };

    const pushListItem = (li: HTMLElement, listTag: "ul" | "ol", startIndex: number) => {
        const listClass =
            listTag === "ol"
                ? "list-decimal pl-4 m-0 text-justify text-neutral-800"
                : "list-disc pl-4 m-0 text-justify text-neutral-800";
        const listItem = (
            <li className="m-0">
                <div className={richTextClass} dangerouslySetInnerHTML={{ __html: li.innerHTML }} />
            </li>
        );

        if (listTag === "ol") {
            blocks.push(
                <ol key={nextKey("ol")} start={startIndex} className={listClass}>
                    {listItem}
                </ol>
            );
            return;
        }

        blocks.push(
            <ul key={nextKey("ul")} className={listClass}>
                {listItem}
            </ul>
        );
    };

    const pushList = (listEl: HTMLUListElement | HTMLOListElement) => {
        const tag = listEl.tagName.toLowerCase() as "ul" | "ol";
        const baseStart =
            tag === "ol" ? Number.parseInt(listEl.getAttribute("start") || "1", 10) || 1 : 1;
        const items = Array.from(listEl.children).filter(
            (child) => child.tagName.toLowerCase() === "li"
        ) as HTMLLIElement[];

        items.forEach((li, index) => {
            pushListItem(li, tag, baseStart + index);
        });
    };

    const walkNodes = (nodes: ChildNode[]) => {
        nodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) {
                    pushParagraph(text);
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();

            if (tag === "p") {
                pushParagraph(el.innerHTML);
                return;
            }

            if (tag === "ul" || tag === "ol") {
                pushList(el as HTMLUListElement | HTMLOListElement);
                return;
            }

            if (el.childNodes.length > 0) {
                walkNodes(Array.from(el.childNodes));
                return;
            }

            blocks.push(
                <div
                    key={nextKey("block")}
                    className={richTextClass}
                    dangerouslySetInnerHTML={{ __html: el.outerHTML }}
                />
            );
        });
    };

    walkNodes(Array.from(root.childNodes));

    if (blocks.length > 0) return blocks;

    // Fallback: render the HTML as-is as one block.
    return [
        <div
            key="html-single"
            className={richTextClass}
            dangerouslySetInnerHTML={{ __html: description }}
        />,
    ];
};

export const ResumePreview = ({ onPaginationChange }: ResumePreviewProps) => {
    const { data, settings } = useResumeStore();
    const { basics, experience, education, skills } = data;
    const measureContainerRef = useRef<HTMLDivElement>(null);
    const pageContentMeasureRef = useRef<HTMLDivElement>(null);
    const blockMeasureRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Smart-Fit (on-demand) uses the measurement container's height.
    const smartFitResult = useSmartFit(measureContainerRef, data, settings);

    // Get section order with fallback
    const sectionOrder =
        data.sectionOrder && data.sectionOrder.length > 0 ? data.sectionOrder : DEFAULT_SECTION_ORDER;

    const blocks = useMemo<ResumeBlock[]>(() => {
        const allBlocks: ResumeBlock[] = [];

        // Header (first page only)
        allBlocks.push({
            id: "header",
            element: (
                <header className="text-center mb-5 pb-3">
                    <h1
                        className="font-bold tracking-tight mb-1.5 leading-none"
                        style={{ fontSize: "var(--font-size-name)" }}
                    >
                        {basics.name}
                    </h1>
                    <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-[9pt] text-neutral-700 tracking-wide">
                        {basics.phone && <span>{basics.phone}</span>}
                        {basics.email && (
                            <span className="before:content-['·'] before:mx-2 before:text-neutral-400">{basics.email}</span>
                        )}
                        {basics.socials.map((s, i) => (
                            <span key={i} className="before:content-['·'] before:mx-2 before:text-neutral-400">
                                {s.url}
                            </span>
                        ))}
                    </div>
                </header>
            ),
        });

        const pushSectionTitle = (id: string, title: string, marginBottomClass: string) => {
            allBlocks.push({
                id,
                keepWithNext: true,
                element: (
                    <h2
                        className={`font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 text-neutral-800 ${marginBottomClass}`}
                        style={{ fontSize: "var(--font-size-section)" }}
                    >
                        {title}
                    </h2>
                ),
            });
        };

        const pushExperienceLikeItem = (
            prefix: string,
            item: { id: string; company: string; role?: string; location?: string; startDate?: string; endDate?: string | "Present"; description?: string },
            trailingMarginClass: string
        ) => {
            const descriptionBlocks = getDescriptionBlocks(item.description || "");
            const headerKeepWithNext = descriptionBlocks.length > 0;

            allBlocks.push({
                id: `${prefix}-${item.id}-header`,
                keepWithNext: headerKeepWithNext,
                element: (
                    <div className={descriptionBlocks.length > 0 ? "mb-1" : trailingMarginClass}>
                        <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className="font-bold text-black">{item.company}</h3>
                            {item.location && <span className="text-[9pt] text-neutral-600">{item.location}</span>}
                        </div>
                        {(item.role || item.startDate) && (
                            <div className="flex justify-between items-baseline">
                                <p className="italic text-neutral-700">{item.role}</p>
                                {item.startDate && (
                                    <span className="text-[9pt] text-neutral-600 tabular-nums">
                                        {item.startDate}
                                        {item.endDate ? ` – ${item.endDate}` : ""}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ),
            });

            if (descriptionBlocks.length === 0) return;

            descriptionBlocks.forEach((node, index) => {
                const isLastDescription = index === descriptionBlocks.length - 1;
                const mbClass = isLastDescription ? trailingMarginClass : "mb-0.5";
                allBlocks.push({
                    id: `${prefix}-${item.id}-desc-${index}`,
                    element: <div className={mbClass}>{node}</div>,
                });
            });
        };

        // Render sections in configured order.
        sectionOrder.forEach(sectionKey => {
            // Experience
            if (sectionKey === "experience") {
                pushSectionTitle(
                    "section-experience-title",
                    data.sectionTitles?.experience || "Professional Experience",
                    "mb-3"
                );

                if (experience.length === 0) {
                    allBlocks.push({
                        id: "section-experience-empty",
                        element: <p className="text-neutral-400 italic text-sm mb-4">点击左侧编辑器添加工作经历...</p>,
                    });
                    return;
                }

                experience.forEach((job, index) => {
                    const isLast = index === experience.length - 1;
                    pushExperienceLikeItem(
                        "experience",
                        {
                            id: job.id,
                            company: job.company,
                            role: job.role,
                            location: job.location,
                            startDate: job.startDate,
                            endDate: job.endDate,
                            description: job.description,
                        },
                        isLast ? "mb-4" : "mb-3"
                    );
                });
                return;
            }

            // Education
            if (sectionKey === "education") {
                pushSectionTitle("section-education-title", data.sectionTitles?.education || "Education", "mb-3");

                if (education.length === 0) {
                    allBlocks.push({
                        id: "section-education-empty",
                        element: <p className="text-neutral-400 italic text-sm mb-4">点击左侧编辑器添加教育背景...</p>,
                    });
                    return;
                }

                education.forEach((edu, index) => {
                    const descriptionBlocks = getDescriptionBlocks(edu.description || "");
                    const isLast = index === education.length - 1;
                    const trailingMarginClass = isLast ? "mb-4" : "mb-2";

                    allBlocks.push({
                        id: `education-${edu.id}-header`,
                        keepWithNext: descriptionBlocks.length > 0,
                        element: (
                            <div className={descriptionBlocks.length > 0 ? "mb-0.5" : trailingMarginClass}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-black">{edu.school}</h3>
                                    <span className="text-[9pt] text-neutral-600">{edu.location}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <div className="text-neutral-700">
                                        <span className="italic">{edu.degree}</span>
                                        {edu.gpa && <span className="not-italic ml-2">• {edu.gpa}</span>}
                                    </div>
                                    <span className="text-[9pt] text-neutral-600 tabular-nums">
                                        {edu.startDate} – {edu.endDate}
                                    </span>
                                </div>
                            </div>
                        ),
                    });

                    descriptionBlocks.forEach((node, i) => {
                        const isLastDesc = i === descriptionBlocks.length - 1;
                        const mbClass = isLastDesc ? trailingMarginClass : "mb-0.5";
                        allBlocks.push({
                            id: `education-${edu.id}-desc-${i}`,
                            element: <div className={mbClass}>{node}</div>,
                        });
                    });
                });
                return;
            }

            // Skills
            if (sectionKey === "skills") {
                pushSectionTitle(
                    "section-skills-title",
                    data.sectionTitles?.skills || "Skills & Interests",
                    "mb-2"
                );

                if (skills.length === 0) {
                    allBlocks.push({
                        id: "section-skills-empty",
                        element: <p className="text-neutral-400 italic text-sm mb-4">点击左侧编辑器添加技能...</p>,
                    });
                    return;
                }

                skills.forEach((cat, index) => {
                    const isLast = index === skills.length - 1;
                    allBlocks.push({
                        id: `skills-${cat.id}`,
                        element: (
                            <div className={isLast ? "mb-4" : "mb-0.5"}>
                                <span className="font-bold text-black">{cat.name}:</span>{" "}
                                <span className="text-neutral-800">{cat.items.join(", ")}</span>
                            </div>
                        ),
                    });
                });
                return;
            }

            // Custom Section
            const customSection = data.customSections.find(s => s.id === sectionKey);
            if (!customSection) return;

            const hasContent =
                (customSection.type === "summary" && customSection.content) ||
                (customSection.type === "honors" && customSection.honors && customSection.honors.length > 0) ||
                ((customSection.type === "portfolio" || customSection.type === "custom") &&
                    customSection.items &&
                    customSection.items.length > 0);

            const getPlaceholder = () => {
                switch (customSection.type) {
                    case "summary":
                        return "点击左侧编辑器添加内容...";
                    case "honors":
                        return "点击左侧编辑器添加荣誉奖项...";
                    case "portfolio":
                        return "点击左侧编辑器添加项目作品...";
                    default:
                        return "点击左侧编辑器添加内容...";
                }
            };

            pushSectionTitle(`custom-${customSection.id}-title`, customSection.title, "mb-3");

            if (!hasContent) {
                allBlocks.push({
                    id: `custom-${customSection.id}-empty`,
                    element: <p className="text-neutral-400 italic text-sm mb-4">{getPlaceholder()}</p>,
                });
                return;
            }

            if (customSection.type === "summary" && customSection.content) {
                const parts = customSection.content
                    .split("\n")
                    .map(p => p.trim())
                    .filter(Boolean);

                if (parts.length === 0) {
                    allBlocks.push({
                        id: `custom-${customSection.id}-summary-empty`,
                        element: <p className="text-neutral-400 italic text-sm mb-4">{getPlaceholder()}</p>,
                    });
                    return;
                }

                parts.forEach((p, index) => {
                    const isLast = index === parts.length - 1;
                    allBlocks.push({
                        id: `custom-${customSection.id}-summary-${index}`,
                        element: (
                            <p className={`text-justify text-neutral-800 leading-relaxed ${isLast ? "mb-4" : "mb-1"}`}>
                                {p}
                            </p>
                        ),
                    });
                });
                return;
            }

            if (customSection.type === "honors" && customSection.honors && customSection.honors.length > 0) {
                customSection.honors.forEach((honor, index) => {
                    const isLast = index === customSection.honors!.length - 1;
                    allBlocks.push({
                        id: `custom-${customSection.id}-honor-${honor.id}`,
                        element: (
                            <div className={isLast ? "mb-4" : "mb-1"}>
                                <div className="pl-4 relative text-neutral-800">
                                    <span className="absolute left-1 top-[0.6em] text-neutral-800">•</span>
                                    <div>
                                        <span className="font-bold text-black">{honor.title}</span>
                                        {honor.issuer && <span className="text-neutral-600"> | {honor.issuer}</span>}
                                        {honor.date && <span className="text-neutral-600"> | {honor.date}</span>}
                                        {honor.description && (
                                            <div className="mt-0.5 text-neutral-700">{getDescriptionBlocks(honor.description)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                    });
                });
                return;
            }

            if (
                (customSection.type === "portfolio" || customSection.type === "custom") &&
                customSection.items &&
                customSection.items.length > 0
            ) {
                customSection.items.forEach((item, index) => {
                    const isLast = index === customSection.items!.length - 1;
                    pushExperienceLikeItem(
                        `custom-${customSection.id}`,
                        {
                            id: item.id,
                            company: item.company,
                            role: item.role,
                            location: item.location,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            description: item.description,
                        },
                        isLast ? "mb-4" : "mb-3"
                    );
                });
            }
        });

        return allBlocks;
    }, [basics, data.customSections, data.sectionTitles, education, experience, sectionOrder, skills]);

    const [pageBlockIds, setPageBlockIds] = useState<string[][]>(() => [blocks.map(b => b.id)]);
    const lastReportedPaginationRef = useRef<string>("");

    const blocksById = useMemo(() => new Map(blocks.map(block => [block.id, block])), [blocks]);

    const pageStyle: React.CSSProperties = useMemo(
        () => {
            const density = clamp(Number(settings.density) || 1, 0.8, 1.2);
            const densityDelta = density - 1;

            const scaledVars: Record<string, unknown> = { ...(smartFitResult.styles as Record<string, unknown>) };

            const marginX = scaledVars["--margin-x"];
            const marginY = scaledVars["--margin-y"];
            if (typeof marginX === "string") scaledVars["--margin-x"] = scaleCssLength(marginX, density);
            if (typeof marginY === "string") scaledVars["--margin-y"] = scaleCssLength(marginY, density);

            const lineHeight = scaledVars["--line-height-body"];
            const baseLineHeight =
                typeof lineHeight === "number"
                    ? lineHeight
                    : typeof lineHeight === "string"
                        ? Number.parseFloat(lineHeight)
                        : NaN;
            if (Number.isFinite(baseLineHeight)) {
                scaledVars["--line-height-body"] = clamp(baseLineHeight + densityDelta * 0.5, 1.0, 1.5);
            }

            return {
                ...(scaledVars as React.CSSProperties),
                fontFamily: "var(--font-family-resume)",
                fontSize: "var(--font-size-body)",
                lineHeight: "var(--line-height-body)",
                letterSpacing: "var(--letter-spacing)",
                padding: "var(--margin-y) var(--margin-x)",
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                boxSizing: "border-box",
            };
        },
        [smartFitResult.styles, settings.density]
    );

    const measureStyle: React.CSSProperties = useMemo(
        () => ({
            ...pageStyle,
            height: "auto",
            minHeight: "auto",
        }),
        [pageStyle]
    );

    useLayoutEffect(() => {
        const measure = () => {
            const pageContentEl = pageContentMeasureRef.current;
            if (!pageContentEl) return;

            const pageContentHeight = pageContentEl.getBoundingClientRect().height;
            if (pageContentHeight <= 0) return;

            const heights = new Map<string, number>();
            for (const block of blocks) {
                const wrapper = blockMeasureRefs.current[block.id];
                const el = (wrapper?.firstElementChild as HTMLElement | null) ?? null;
                if (!el) continue;
                heights.set(block.id, getElementOuterHeight(el));
            }

            const nextPageBlockIds: string[][] = [];
            const nextUsedHeights: number[] = [];
            let current: string[] = [];
            let used = 0;

            const flush = () => {
                if (current.length > 0) {
                    nextPageBlockIds.push(current);
                    nextUsedHeights.push(used);
                }
                current = [];
                used = 0;
            };

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const h = heights.get(block.id) ?? 0;
                const nextH = block.keepWithNext ? (heights.get(blocks[i + 1]?.id) ?? 0) : 0;

                // If this block (and its "kept" next block) doesn't fit, start a new page.
                if (current.length > 0 && used + h + nextH > pageContentHeight) {
                    flush();
                }

                current.push(block.id);
                used += h;

                // Safety: if a single block overflows a page (should be rare due to splitting),
                // force it onto its own page to avoid infinite loops.
                if (current.length === 1 && used > pageContentHeight) {
                    flush();
                }
            }

            flush();

            setPageBlockIds(prev => (pageIdsEqual(prev, nextPageBlockIds) ? prev : nextPageBlockIds));

            const pageCount = nextPageBlockIds.length;
            const lastUsed = nextUsedHeights[nextUsedHeights.length - 1] ?? 0;
            const lastPageFill = pageCount > 0 ? clamp(lastUsed / pageContentHeight, 0, 1) : null;
            const paginationKey = `${pageCount}:${lastPageFill?.toFixed(3) ?? "null"}`;
            if (paginationKey !== lastReportedPaginationRef.current) {
                lastReportedPaginationRef.current = paginationKey;
                onPaginationChange?.({ pageCount, lastPageFill });
            }
        };

        let raf = 0;
        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };

        measure();

        const resizeObserver = new ResizeObserver(schedule);
        if (measureContainerRef.current) resizeObserver.observe(measureContainerRef.current);
        if (pageContentMeasureRef.current) resizeObserver.observe(pageContentMeasureRef.current);

        return () => {
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
        };
    }, [blocks, pageStyle]);

    return (
        <div className="relative flex flex-col items-center">
            {/* Hidden measurement layer (off-screen) */}
            <div
                aria-hidden="true"
                className="fixed left-[-99999px] top-0 opacity-0 pointer-events-none"
            >
                {/* Page metrics (content height excluding padding) */}
                <div style={pageStyle}>
                    <div ref={pageContentMeasureRef} className="h-full" />
                </div>

                {/* Full document measurement (for block heights + smart-fit) */}
                <div
                    ref={measureContainerRef}
                    className="bg-white text-neutral-900 flex flex-col"
                    style={measureStyle}
                >
                    {blocks.map((block) => (
                        <div
                            key={block.id}
                            className="contents"
                            ref={(el) => {
                                blockMeasureRefs.current[block.id] = el;
                            }}
                        >
                            {block.element}
                        </div>
                    ))}
                </div>
            </div>

            {/* Paginated pages */}
            <div className="flex flex-col items-center gap-10">
                {pageBlockIds.map((ids, pageIndex) => (
                    <div
                        key={pageIndex}
                        className="bg-white text-neutral-900 shadow-lg"
                        style={pageStyle}
                    >
                        <div className="h-full flex flex-col">
                            {ids.map((id) => {
                                const block = blocksById.get(id);
                                if (!block) return null;
                                return <Fragment key={id}>{block.element}</Fragment>;
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

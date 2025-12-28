import { useState, useEffect, useCallback } from 'react';
import { ResumeData, DesignSettings, ExperienceItem, EducationItem, SkillCategory, HonorItem } from '@/lib/types';

export type PageBlock = {
    id: string;
    type: string;
    content: any;
    sectionId: string;
    height: number;
    marginTop: number;
    marginBottom: number;
};

export type Page = {
    id: string;
    blocks: PageBlock[];
    currentHeight: number;
};

// A4 height in pixels (96 DPI)
// 297mm * 3.7795 px/mm ≈ 1122px
// Subtracting margins: 0.8in * 96 * 2 ≈ 153px
// Content area height ≈ 969px
const A4_HEIGHT_PX = 1123; // Standard A4 height at 96 DPI
const PIXELS_PER_MM = 3.7795275591;

export const useResumePagination = (
    data: ResumeData,
    settings: DesignSettings,
    containerRef: React.RefObject<HTMLElement | null>
) => {
    const [pages, setPages] = useState<Page[]>([]);
    const [isCalculating, setIsCalculating] = useState(true);

    // Initial calculation trigger
    useEffect(() => {
        setIsCalculating(true);
    }, [data, settings.language, settings.density, settings.smartFitEnabled]);

    const calculatePages = useCallback(() => {
        if (!containerRef.current) return;

        const measurementContainer = containerRef.current.querySelector('.measurement-layer');
        if (!measurementContainer) return;

        // Get actual page configuration based on settings
        const isZH = settings.language === 'zh';
        const marginYmm = isZH ? 20 : (0.8 * 25.4); // 20mm or 0.8in (~20.32mm)
        const marginYpx = marginYmm * PIXELS_PER_MM;


        // Content height = A4 height - (top margin + bottom margin)
        // Note: For bin-packing, we fill the CONTENT area.
        // The actual rendering will apply padding to the page container.
        const HEIGHT_BUFFER = 5; // Safety buffer for sub-pixel rendering
        const CONTENT_HEIGHT = A4_HEIGHT_PX - (marginYpx * 2) - HEIGHT_BUFFER;

        const blocks: PageBlock[] = [];
        const elements = measurementContainer.querySelectorAll('[data-measure-id]');

        // Stage 1: Measure all blocks
        elements.forEach((el) => {
            const id = el.getAttribute('data-measure-id');
            const type = el.getAttribute('data-type');
            const sectionId = el.getAttribute('data-section');
            const style = window.getComputedStyle(el);
            const height = el.getBoundingClientRect().height;
            const marginTop = parseFloat(style.marginTop);
            const marginBottom = parseFloat(style.marginBottom);

            if (id && type && sectionId) {
                blocks.push({
                    id,
                    type,
                    content: null, // Content reference is handled by renderer via ID matching
                    sectionId,
                    height,
                    marginTop,
                    marginBottom
                });
            }
        });

        // Stage 2: Distribute blocks into pages (Bin Packing)
        const newPages: Page[] = [];
        let currentPage: Page = {
            id: 'page-1',
            blocks: [],
            currentHeight: 0
        };

        const addToNewPage = (block: PageBlock) => {
            newPages.push(currentPage);
            currentPage = {
                id: `page-${newPages.length + 1}`,
                blocks: [block],
                currentHeight: block.height + block.marginBottom // First item only counts bottom margin (effectively)
            };
        };

        blocks.forEach((block, index) => {
            const isFirst = index === 0;
            const effectiveHeight = block.height + (isFirst ? 0 : Math.max(block.marginTop, 0)) + block.marginBottom;

            // Orphan Control: If it's a section title, check if next item fits
            let shouldMoveToNewPage = false;
            if (block.type === 'section-title' && index < blocks.length - 1) {
                const nextBlock = blocks[index + 1];
                // Check if next block belongs to same section
                if (nextBlock.sectionId === block.sectionId) {
                    const nextBlockHeight = nextBlock.height + nextBlock.marginTop + nextBlock.marginBottom; // Approx
                    // Check if BOTH fit
                    // Note: We need to account for margin collapse between title and item
                    const marginCollapse = Math.min(block.marginBottom, nextBlock.marginTop);
                    const combinedHeight = effectiveHeight + nextBlockHeight - marginCollapse;

                    if (currentPage.currentHeight + combinedHeight > CONTENT_HEIGHT) {
                        shouldMoveToNewPage = true;
                    }
                }
            }

            // Check if block fits in current page (normal check) or forced move
            if (!shouldMoveToNewPage && currentPage.currentHeight + effectiveHeight <= CONTENT_HEIGHT) {
                // Determine margin collapse with previous element
                const prevBlock = currentPage.blocks[currentPage.blocks.length - 1];
                let addedHeight = effectiveHeight;

                if (prevBlock) {
                    // Simple margin collapse approximation
                    const marginCollapse = Math.min(prevBlock.marginBottom, block.marginTop);
                    addedHeight -= marginCollapse;
                }

                currentPage.blocks.push(block);
                currentPage.currentHeight += addedHeight;
            } else {
                // Must move to new page
                // Special case: If it's a section title and it's near the bottom,
                // we might have already moved it (orphan control). 
                // But for now, simple greedy fitting.
                addToNewPage(block);
            }
        });

        newPages.push(currentPage);
        setPages(newPages);
        setIsCalculating(false);

    }, [settings.language]); // Recalculate if language (margins) changes

    // Expose a function to run calculation after DOM updates
    return {
        pages,
        isCalculating,
        calculatePages
    };
};

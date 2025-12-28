"use client";

import { useEffect, useState } from "react";
import { ResumeData, DesignSettings } from "./types";

/**
 * 2025/2026 Banking & Consulting Resume Typography Standards
 * 
 * RESEARCH FINDINGS:
 * 
 * ENGLISH (Goldman Sachs, Morgan Stanley, McKinsey, BCG, Bain):
 * - Primary Fonts: Times New Roman (Goldman Sachs standard), Arial, Calibri
 * - Body: 10-11pt (most common: 10.5pt)
 * - Name: 14-18pt
 * - Section Titles: 11-12pt, bold, uppercase
 * - Line Spacing: 1.0-1.15
 * - Margins: 0.75-1 inch (optimal: 0.8in)
 * - One page mandatory for analysts/associates
 * 
 * CHINESE (中金, 高盛中国, 麦肯锡中国):
 * - Primary Font: 微软雅黑 (Microsoft YaHei) - industry standard
 * - Secondary: 思源宋体 (Source Han Serif) for traditional feel
 * - Body: 10.5pt (五号字)
 * - Name: 16-18pt, bold
 * - Section Titles: 11-12pt, bold
 * - Line Spacing: 1.2-1.35
 * - Margins: 2cm all sides
 * - Character Spacing: slightly tighter (-0.3pt)
 */

export type SmartFitResult = {
    styles: React.CSSProperties;
    status: 'perfect' | 'tight' | 'overflow';
    message: string;
};

// 2025 Banking/Consulting Format Presets (Research-Backed)
export const FORMAT_PRESETS = {
    en: {
        // Goldman Sachs / Morgan Stanley / McKinsey standard
        fontFamily: "'Times New Roman', 'Garamond', Georgia, serif",
        fontFamilyAlt: "'Arial', 'Calibri', sans-serif", // Modern alternative
        fontSize: '10.5pt',
        lineHeight: 1.15,
        marginX: '0.8in',
        marginY: '0.8in', // FIXED: Match PDF margin
        nameSize: '16pt',
        sectionTitleSize: '11pt',
        letterSpacing: 'normal',
        // Bullet styling
        bulletIndent: '0.2in',
    },
    zh: {
        // 中金/高盛中国/麦肯锡中国 standard
        fontFamily: "'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        fontFamilyAlt: "'Source Han Serif SC', '思源宋体', 'Noto Serif SC', 'SimSun', '宋体', serif",
        fontSize: '10.5pt', // 五号字
        lineHeight: 1.3,
        marginX: '2cm',
        marginY: '2cm', // FIXED: Match PDF margin
        nameSize: '18pt',
        sectionTitleSize: '11pt',
        letterSpacing: '-0.02em', // Slightly tighter for Chinese
        // Bullet styling
        bulletIndent: '0.5cm',
    }
};

/**
 * Apply Smart Fit algorithm to shrink content to one page.
 * Progressive compression following banking standards.
 */
export const applySmartFit = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    language: 'en' | 'zh' | undefined
): SmartFitResult => {
    const lang = language || 'en';
    const preset = FORMAT_PRESETS[lang];

    const baseStyles: React.CSSProperties = {
        '--font-family-resume': preset.fontFamily,
        '--font-size-body': preset.fontSize,
        '--line-height-body': preset.lineHeight,
        '--margin-x': preset.marginX,
        '--margin-y': preset.marginY,
        '--font-size-name': preset.nameSize,
        '--font-size-section': preset.sectionTitleSize,
        '--letter-spacing': preset.letterSpacing,
    } as React.CSSProperties;

    if (!containerRef.current) {
        return { styles: baseStyles, status: 'perfect', message: '' };
    }

    const el = containerRef.current;
    // Letter size at 96 DPI = 11" * 96 = 1056px
    const PAGE_HEIGHT_PX = 1056;
    const currentHeight = el.scrollHeight;

    if (currentHeight <= PAGE_HEIGHT_PX) {
        return {
            styles: baseStyles,
            status: 'perfect',
            message: '✓ 完美适配一页 / Fits perfectly'
        };
    }

    // Stage 1: Tighten margins (banking acceptable: down to 0.5in)
    if (currentHeight <= PAGE_HEIGHT_PX * 1.15) {
        return {
            styles: {
                ...baseStyles,
                '--margin-x': lang === 'en' ? '0.6in' : '1.5cm',
                '--margin-y': lang === 'en' ? '0.5in' : '1.2cm',
                '--line-height-body': lang === 'en' ? 1.1 : 1.2,
            } as React.CSSProperties,
            status: 'tight',
            message: '⚡ 已调整边距 / Margins tightened'
        };
    }

    // Stage 2: Reduce font + line height (minimum readable: 9.5pt)
    if (currentHeight <= PAGE_HEIGHT_PX * 1.3) {
        return {
            styles: {
                ...baseStyles,
                '--margin-x': lang === 'en' ? '0.5in' : '1.2cm',
                '--margin-y': lang === 'en' ? '0.4in' : '1cm',
                '--font-size-body': '9.5pt',
                '--font-size-section': '10pt',
                '--line-height-body': lang === 'en' ? 1.05 : 1.15,
            } as React.CSSProperties,
            status: 'tight',
            message: '⚡ 已调整字号和间距 / Font & spacing reduced'
        };
    }

    // Stage 3: Maximum compression (reaching readability limit)
    return {
        styles: {
            ...baseStyles,
            '--margin-x': lang === 'en' ? '0.5in' : '1cm',
            '--margin-y': lang === 'en' ? '0.35in' : '0.8cm',
            '--font-size-body': '9pt',
            '--font-size-name': '14pt',
            '--font-size-section': '9.5pt',
            '--line-height-body': 1.0,
            '--letter-spacing': lang === 'en' ? '-0.01em' : '-0.03em',
        } as React.CSSProperties,
        status: 'overflow',
        message: '⚠️ 内容过多，请考虑精简 / Content may overflow - consider editing'
    };
};

/**
 * Get base styles without Smart Fit (for multi-page mode)
 */
export const getBaseStyles = (language: 'en' | 'zh' | undefined): React.CSSProperties => {
    const lang = language || 'en';
    const preset = FORMAT_PRESETS[lang];
    return {
        '--font-family-resume': preset.fontFamily,
        '--font-size-body': preset.fontSize,
        '--line-height-body': preset.lineHeight,
        '--margin-x': preset.marginX,
        '--margin-y': preset.marginY,
        '--font-size-name': preset.nameSize,
        '--font-size-section': preset.sectionTitleSize,
        '--letter-spacing': preset.letterSpacing,
    } as React.CSSProperties;
};

/**
 * Hook for Smart Fit (only triggers when enabled)
 */
export const useSmartFit = (
    ref: React.RefObject<HTMLDivElement | null>,
    data: ResumeData,
    settings: DesignSettings
): SmartFitResult => {
    const [result, setResult] = useState<SmartFitResult>({
        styles: getBaseStyles(settings.language),
        status: 'perfect',
        message: ''
    });

    useEffect(() => {
        const lang = settings.language || 'en';
        if (settings.smartFitEnabled) {
            const timer = setTimeout(() => {
                const fitResult = applySmartFit(ref, lang);
                setResult(fitResult);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setResult({
                styles: getBaseStyles(lang),
                status: 'perfect',
                message: ''
            });
        }
    }, [data, settings.smartFitEnabled, settings.language, ref]);

    return result;
};

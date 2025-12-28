import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { type Browser } from 'puppeteer';

type ExportSettings = {
    language?: 'en' | 'zh';
    smartFitEnabled?: boolean;
    density?: number;
    layoutMode?: 'recommended' | 'onePage' | 'twoPage' | 'unlimited';
    paperSize?: 'A4' | 'Letter';
};

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

// Types for PDF generation
interface SocialLink { platform: string; url: string; }
interface ExperienceItem { company: string; role: string; location: string; startDate: string; endDate: string; description: string; visible?: boolean; }
interface EducationItem { school: string; degree: string; location: string; startDate: string; endDate: string; gpa?: string; description?: string; visible?: boolean; }
interface SkillCategory { name: string; items: string[]; }
interface HonorItem { title: string; issuer: string; date: string; description?: string; }
interface CustomSection {
    id: string;
    type: 'summary' | 'honors' | 'portfolio' | 'custom';
    title: string;
    content?: string;
    items?: ExperienceItem[];
    honors?: HonorItem[];
    visible?: boolean;
}

interface ResumeData {
    basics: { name: string; phone: string; email: string; socials: SocialLink[]; };
    sectionTitles: { experience: string; education: string; skills: string;[key: string]: string; };
    sectionOrder: string[];
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: SkillCategory[];
    customSections: CustomSection[];
}

type ExportTypography = {
    language: 'en' | 'zh';
    fontFamily: string;
    fontSize: string;
    lineHeight: number;
    marginX: string;
    marginY: string;
    nameSize: string;
    sectionSize: string;
    letterSpacing: string;
};

type SmartFitStage = 0 | 1 | 2 | 3;

const getBaseTypography = (language: 'en' | 'zh'): ExportTypography => {
    if (language === 'zh') {
        return {
            language,
            fontFamily: "'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
            fontSize: '10.5pt',
            lineHeight: 1.3,
            marginX: '2cm',
            marginY: '2cm',
            nameSize: '18pt',
            sectionSize: '11pt',
            letterSpacing: '-0.02em',
        };
    }

    return {
        language,
        fontFamily: "'Times New Roman', 'Garamond', Georgia, serif",
        fontSize: '10.5pt',
        lineHeight: 1.15,
        marginX: '0.8in',
        marginY: '0.8in',
        nameSize: '16pt',
        sectionSize: '11pt',
        letterSpacing: 'normal',
    };
};

const applySmartFitStage = (base: ExportTypography, stage: SmartFitStage): ExportTypography => {
    if (stage === 0) return { ...base };

    if (stage === 1) {
        return {
            ...base,
            marginX: base.language === 'zh' ? '1.5cm' : '0.6in',
            marginY: base.language === 'zh' ? '1.2cm' : '0.5in',
            lineHeight: base.language === 'zh' ? 1.2 : 1.1,
        };
    }

    if (stage === 2) {
        return {
            ...base,
            marginX: base.language === 'zh' ? '1.2cm' : '0.5in',
            marginY: base.language === 'zh' ? '1cm' : '0.4in',
            fontSize: '9.5pt',
            sectionSize: '10pt',
            lineHeight: base.language === 'zh' ? 1.15 : 1.05,
        };
    }

    return {
        ...base,
        marginX: base.language === 'zh' ? '1cm' : '0.5in',
        marginY: base.language === 'zh' ? '0.8cm' : '0.35in',
        fontSize: '9pt',
        nameSize: '14pt',
        sectionSize: '9.5pt',
        lineHeight: 1.0,
        letterSpacing: base.language === 'zh' ? '-0.03em' : '-0.01em',
    };
};

const applyDensity = (typography: ExportTypography, density: number): ExportTypography => {
    const densityDelta = density - 1;
    return {
        ...typography,
        marginX: scaleCssLength(typography.marginX, density),
        marginY: scaleCssLength(typography.marginY, density),
        lineHeight: clamp(typography.lineHeight + densityDelta * 0.5, 1.0, 1.5),
    };
};

const buildTypography = (
    language: 'en' | 'zh',
    density: number,
    stage: SmartFitStage
): ExportTypography => {
    const base = getBaseTypography(language);
    const staged = applySmartFitStage(base, stage);
    return applyDensity(staged, density);
};

// Complete HTML template with embedded styles for PDF generation
function generateResumeHTML(
    data: ResumeData,
    typography: ExportTypography,
    pageSize: { width: string; height: string },
    options?: { allowItemBreaks?: boolean }
) {
    const { fontFamily, fontSize, lineHeight, nameSize, sectionSize, letterSpacing, marginX, marginY } = typography;
    const { width: pageWidth, height: pageHeight } = pageSize;
    const allowItemBreaks = options?.allowItemBreaks === true;
    const itemBreakRule = allowItemBreaks ? "auto" : "avoid";

    // Section title style
    const sectionTitleStyle = `font-weight: bold; font-size: ${sectionSize}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #d0d0d0; padding-bottom: 4px; margin-bottom: 12px; color: #1a1a1a;`;

    // Generate Experience HTML
    const generateExperienceHTML = (items: ExperienceItem[], title: string) => {
        const visibleItems = items.filter(item => item.visible !== false);
        if (visibleItems.length === 0) return '';

        const itemsHTML = visibleItems.map(job => `
            <div class="experience-item" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                    <h3 style="font-weight: bold; margin: 0; font-size: ${fontSize};">${job.company}</h3>
                    <span style="font-size: 9pt; color: #4a4a4a;">${job.location}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <p style="font-style: italic; margin: 0; color: #4a4a4a;">${job.role}</p>
                    <span style="font-size: 9pt; color: #4a4a4a;">${job.startDate} – ${job.endDate}</span>
                </div>
                <div style="text-align: justify; color: #1a1a1a;">
                    ${job.description}
                </div>
            </div>
        `).join('');

        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                ${itemsHTML}
            </section>
        `;
    };

    // Generate Education HTML
    const generateEducationHTML = (items: EducationItem[], title: string) => {
        const visibleItems = items.filter(item => item.visible !== false);
        if (visibleItems.length === 0) return '';

        const itemsHTML = visibleItems.map(edu => `
            <div class="education-item" style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                    <h3 style="font-weight: bold; margin: 0; font-size: ${fontSize};">${edu.school}</h3>
                    <span style="font-size: 9pt; color: #4a4a4a;">${edu.location}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="color: #4a4a4a;">
                        <span style="font-style: italic;">${edu.degree}</span>
                        ${edu.gpa ? `<span style="margin-left: 8px;">• ${edu.gpa}</span>` : ''}
                    </div>
                    <span style="font-size: 9pt; color: #4a4a4a;">${edu.startDate} – ${edu.endDate}</span>
                </div>
                ${edu.description ? `<div style="text-align: justify; color: #1a1a1a; margin-top: 4px;">${edu.description}</div>` : ''}
            </div>
        `).join('');

        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                ${itemsHTML}
            </section>
        `;
    };

    // Generate Skills HTML
    const generateSkillsHTML = (categories: SkillCategory[], title: string) => {
        if (categories.length === 0) return '';

        const categoriesHTML = categories.map(cat => `
            <div style="margin-bottom: 4px;">
                <span style="font-weight: bold;">${cat.name}:</span>
                <span>${cat.items.join(', ')}</span>
            </div>
        `).join('');

        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                ${categoriesHTML}
            </section>
        `;
    };

    // Generate Summary HTML
    const generateSummaryHTML = (content: string, title: string) => {
        if (!content) return '';
        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                <p style="text-align: justify;">${content}</p>
            </section>
        `;
    };

    // Generate Honors HTML
    const generateHonorsHTML = (honors: HonorItem[], title: string) => {
        if (!honors || honors.length === 0) return '';

        const honorsHTML = honors.map(honor => `
            <li style="margin-bottom: 4px;">
                <span style="font-weight: bold;">${honor.title}</span>
                ${honor.issuer ? `<span style="color: #4a4a4a;"> | ${honor.issuer}</span>` : ''}
                ${honor.date ? `<span style="color: #4a4a4a;"> | ${honor.date}</span>` : ''}
                ${honor.description ? `<div style="margin-top: 2px; color: #1a1a1a;">${honor.description}</div>` : ''}
            </li>
        `).join('');

        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                <ul style="list-style-type: disc; padding-left: 16px; margin: 0;">${honorsHTML}</ul>
            </section>
        `;
    };

    // Generate Custom Items HTML (portfolio/custom type)
    const generateCustomItemsHTML = (items: ExperienceItem[], title: string) => {
        if (!items || items.length === 0) return '';

        const itemsHTML = items.map(item => `
            <div class="custom-item" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                    <h3 style="font-weight: bold; margin: 0; font-size: ${fontSize};">${item.company}</h3>
                    ${item.location ? `<span style="font-size: 9pt; color: #4a4a4a;">${item.location}</span>` : ''}
                </div>
                ${(item.role || item.startDate) ? `
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                        <p style="font-style: italic; margin: 0; color: #4a4a4a;">${item.role || ''}</p>
                        ${item.startDate ? `<span style="font-size: 9pt; color: #4a4a4a;">${item.startDate}${item.endDate ? ` – ${item.endDate}` : ''}</span>` : ''}
                    </div>
                ` : ''}
                ${item.description ? `<div style="text-align: justify; color: #1a1a1a;">${item.description}</div>` : ''}
            </div>
        `).join('');

        return `
            <section style="margin-bottom: 16px;">
                <h2 style="${sectionTitleStyle}">${title}</h2>
                ${itemsHTML}
            </section>
        `;
    };

    // Generate sections based on sectionOrder
    const sectionOrder = data.sectionOrder || ['experience', 'education', 'skills'];

    const sectionsHTML = sectionOrder.map(sectionKey => {
        // Built-in sections
        if (sectionKey === 'experience') {
            return generateExperienceHTML(data.experience || [], data.sectionTitles?.experience || 'Experience');
        }
        if (sectionKey === 'education') {
            return generateEducationHTML(data.education || [], data.sectionTitles?.education || 'Education');
        }
        if (sectionKey === 'skills') {
            return generateSkillsHTML(data.skills || [], data.sectionTitles?.skills || 'Skills');
        }

        // Custom sections
        const customSection = (data.customSections || []).find(s => s.id === sectionKey);
        if (customSection && customSection.visible !== false) {
            switch (customSection.type) {
                case 'summary':
                    return generateSummaryHTML(customSection.content || '', customSection.title);
                case 'honors':
                    return generateHonorsHTML(customSection.honors || [], customSection.title);
                case 'portfolio':
                case 'custom':
                    return generateCustomItemsHTML(customSection.items || [], customSection.title);
                default:
                    return '';
            }
        }

        return '';
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
	    <style>
	        * {
	            margin: 0;
	            padding: 0;
	            box-sizing: border-box;
	        }
            @page {
                size: ${pageWidth} ${pageHeight};
                margin: ${marginY} ${marginX};
            }
	        body {
	            font-family: ${fontFamily};
	            font-size: ${fontSize};
	            line-height: ${lineHeight};
                letter-spacing: ${letterSpacing};
                margin: 0;
	            color: #1a1a1a;
	            background: white;
	        }
	        .resume {
	            width: 100%;
	            background: white;
	        }
        
        
        /* Section styles - allow breaks inside sections */
        section {
            /* break-inside: auto; default */
        }
        
        /* Individual items - avoid breaking in the middle */
        .experience-item,
        .education-item,
        .custom-item,
        .honor-item {
            break-inside: ${itemBreakRule};
            page-break-inside: ${itemBreakRule};
        }
        
        /* Section titles should stay with content */
        h2 {
            break-after: avoid;
            page-break-after: avoid;
            orphans: 3;
            widows: 3;
        }
        
        ul {
            list-style-type: disc;
            padding-left: 16px;
            margin: 0;
        }
        ol {
            list-style-type: decimal;
            padding-left: 16px;
            margin: 0;
        }
        li {
            margin-bottom: 2px;
        }
        p {
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="resume">
        <!-- Header -->
        <header style="text-align: center; margin-bottom: 16px; padding-bottom: 12px;">
            <h1 style="font-weight: bold; font-size: ${nameSize}; margin-bottom: 6px; letter-spacing: 0.5px;">
                ${data.basics?.name || ''}
            </h1>
            <div style="font-size: 9pt; color: #4a4a4a;">
                ${[data.basics?.phone, data.basics?.email, ...(data.basics?.socials || []).map(s => s.url)].filter(Boolean).join(' · ')}
            </div>
        </header>

        ${sectionsHTML}
    </div>
</body>
</html>
    `;
}

export async function POST(request: NextRequest) {
    let browser: Browser | null = null;
    try {
        const { resumeData, language, settings, filename = 'resume.pdf' } = await request.json();

        if (!resumeData) {
            return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
        }

        const exportSettings = settings as ExportSettings | undefined;
        const resolvedLanguage = (exportSettings?.language || language || 'en') as 'en' | 'zh';
        const density = clamp(Number(exportSettings?.density ?? 1), 0.8, 1.2);
        const smartFitRequested =
            exportSettings?.smartFitEnabled === true || exportSettings?.layoutMode === 'onePage';
        const pageSize = { width: '210mm', height: '297mm' };

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        const waitForFonts = async () => {
            try {
                await page.evaluate(() => (document as any).fonts?.ready || Promise.resolve());
            } catch (error) {
                console.warn('Font readiness check failed:', error);
            }
        };

        const renderAndMeasure = async (html: string, marginY: string) => {
            await page.setContent(html, { waitUntil: 'load' });
            await page.emulateMediaType('print');
            await waitForFonts();

            return page.evaluate(({ pageHeightCss, marginYCss }) => {
                const probe = document.createElement('div');
                probe.style.position = 'absolute';
                probe.style.left = '-9999px';
                probe.style.top = '0';
                probe.style.height = pageHeightCss;
                document.body.appendChild(probe);
                const pageHeight = probe.getBoundingClientRect().height;
                probe.remove();

                const marginProbe = document.createElement('div');
                marginProbe.style.position = 'absolute';
                marginProbe.style.left = '-9999px';
                marginProbe.style.top = '0';
                marginProbe.style.height = marginYCss;
                document.body.appendChild(marginProbe);
                const marginY = marginProbe.getBoundingClientRect().height;
                marginProbe.remove();

                return { pageHeight, marginY, contentHeight: document.body.scrollHeight };
            }, { pageHeightCss: pageSize.height, marginYCss: marginY });
        };

        let finalHtml = generateResumeHTML(
            resumeData as ResumeData,
            buildTypography(resolvedLanguage, density, 0),
            pageSize,
            { allowItemBreaks: smartFitRequested }
        );

        let pdfBuffer: Uint8Array;
        try {
            if (smartFitRequested) {
                const stages: SmartFitStage[] = [0, 1, 2, 3];
                for (const stage of stages) {
                    const candidateTypography = buildTypography(resolvedLanguage, density, stage);
                    const candidateHtml = generateResumeHTML(
                        resumeData as ResumeData,
                        candidateTypography,
                        pageSize,
                        { allowItemBreaks: true }
                    );
                    const { pageHeight, marginY, contentHeight } = await renderAndMeasure(
                        candidateHtml,
                        candidateTypography.marginY
                    );
                    const availableHeight = Math.max(pageHeight - marginY * 2, 0);
                    finalHtml = candidateHtml;
                    if (contentHeight <= availableHeight + 1 || stage === 3) break;
                }
            } else {
                await page.setContent(finalHtml, { waitUntil: 'load' });
                await page.emulateMediaType('print');
                await waitForFonts();
            }

            pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            });
        } catch (error) {
            console.error('Primary PDF export failed, retrying without smart-fit:', error);
            const fallbackHtml = generateResumeHTML(
                resumeData as ResumeData,
                buildTypography(resolvedLanguage, density, 0),
                pageSize,
                { allowItemBreaks: true }
            );
            await page.setContent(fallbackHtml, { waitUntil: 'load' });
            await page.emulateMediaType('print');
            await waitForFonts();
            pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            });
        }

        // Return PDF as downloadable file
        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: String(error) },
            { status: 500 }
        );
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

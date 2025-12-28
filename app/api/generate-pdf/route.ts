import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

// Complete HTML template with embedded styles for PDF generation
function generateResumeHTML(data: ResumeData, language: 'en' | 'zh') {
    const isZH = language === 'zh';

    // Typography settings based on language
    const fontFamily = isZH
        ? "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
        : "'Times New Roman', Georgia, serif";
    const fontSize = '10.5pt';
    const lineHeight = isZH ? '1.3' : '1.15';
    const margin = isZH ? '2cm' : '0.8in';
    const nameSize = isZH ? '18pt' : '16pt';
    const sectionSize = '11pt';

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
        body {
            font-family: ${fontFamily};
            font-size: ${fontSize};
            line-height: ${lineHeight};
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
            break-inside: avoid;
            page-break-inside: avoid;
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
    try {
        const { resumeData, language, filename = 'resume.pdf' } = await request.json();

        if (!resumeData) {
            return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
        }

        // Generate HTML with proper styling - now passing full resumeData
        const html = generateResumeHTML(resumeData as ResumeData, language || 'en');

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
        });

        const page = await browser.newPage();

        // Set content and wait for rendering
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for fonts
        await page.evaluateHandle('document.fonts.ready');

        // Generate PDF with A4 size and explicit margins
        const isZH = (language || 'en') === 'zh';
        const marginValue = isZH ? '2cm' : '0.8in';

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: marginValue,
                right: marginValue,
                bottom: marginValue,
                left: marginValue,
            },
        });

        await browser.close();

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
    }
}

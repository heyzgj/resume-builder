import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// Complete HTML template with embedded styles for PDF generation
function generateResumeHTML(data: {
    name: string;
    phone: string;
    email: string;
    socials: { platform: string; url: string }[];
    experience: { company: string; role: string; location: string; startDate: string; endDate: string; description: string }[];
    education: { school: string; degree: string; location: string; startDate: string; endDate: string; gpa?: string }[];
    skills: { name: string; items: string[] }[];
    sectionTitles: { experience: string; education: string; skills: string };
    language: 'en' | 'zh';
}) {
    const isZH = data.language === 'zh';

    // Typography settings based on language
    const fontFamily = isZH
        ? "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
        : "'Times New Roman', Georgia, serif";
    const fontSize = '10.5pt';
    const lineHeight = isZH ? '1.3' : '1.15';
    const margin = isZH ? '2cm' : '0.8in';
    const nameSize = isZH ? '18pt' : '16pt';
    const sectionSize = '11pt';

    const experienceHTML = data.experience.map(job => `
        <div style="margin-bottom: 12px;">
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

    const educationHTML = data.education.map(edu => `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                <h3 style="font-weight: bold; margin: 0; font-size: ${fontSize};">${edu.school}</h3>
                <span style="font-size: 9pt; color: #4a4a4a;">${edu.location}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="color: #4a4a4a;">
                    <span style="font-style: italic;">${edu.degree}</span>
                    ${edu.gpa ? `<span style="margin-left: 8px;">• GPA: ${edu.gpa}</span>` : ''}
                </div>
                <span style="font-size: 9pt; color: #4a4a4a;">${edu.startDate} – ${edu.endDate}</span>
            </div>
        </div>
    `).join('');

    const skillsHTML = data.skills.map(cat => `
        <div style="margin-bottom: 4px;">
            <span style="font-weight: bold;">${cat.name}:</span>
            <span>${cat.items.join(', ')}</span>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 0;
            size: A4;
        }
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
            width: 210mm;
            min-height: 297mm;
            padding: ${margin};
            background: white;
        }
        ul {
            list-style-type: disc;
            padding-left: 16px;
            margin: 0;
        }
        li {
            margin-bottom: 2px;
        }
    </style>
</head>
<body>
    <div class="resume">
        <!-- Header -->
        <header style="text-align: center; margin-bottom: 16px; padding-bottom: 12px;">
            <h1 style="font-weight: bold; font-size: ${nameSize}; margin-bottom: 6px; letter-spacing: 0.5px;">
                ${data.name}
            </h1>
            <div style="font-size: 9pt; color: #4a4a4a;">
                ${[data.phone, data.email, ...data.socials.map(s => s.url)].filter(Boolean).join(' · ')}
            </div>
        </header>

        <!-- Experience -->
        ${data.experience.length > 0 ? `
        <section style="margin-bottom: 16px;">
            <h2 style="font-weight: bold; font-size: ${sectionSize}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #d0d0d0; padding-bottom: 4px; margin-bottom: 12px; color: #1a1a1a;">
                ${data.sectionTitles.experience}
            </h2>
            ${experienceHTML}
        </section>
        ` : ''}

        <!-- Education -->
        ${data.education.length > 0 ? `
        <section style="margin-bottom: 16px;">
            <h2 style="font-weight: bold; font-size: ${sectionSize}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #d0d0d0; padding-bottom: 4px; margin-bottom: 12px; color: #1a1a1a;">
                ${data.sectionTitles.education}
            </h2>
            ${educationHTML}
        </section>
        ` : ''}

        <!-- Skills -->
        ${data.skills.length > 0 ? `
        <section>
            <h2 style="font-weight: bold; font-size: ${sectionSize}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #d0d0d0; padding-bottom: 4px; margin-bottom: 8px; color: #1a1a1a;">
                ${data.sectionTitles.skills}
            </h2>
            ${skillsHTML}
        </section>
        ` : ''}
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

        // Generate HTML with proper styling
        const html = generateResumeHTML({
            name: resumeData.basics?.name || 'Name',
            phone: resumeData.basics?.phone || '',
            email: resumeData.basics?.email || '',
            socials: resumeData.basics?.socials || [],
            experience: resumeData.experience || [],
            education: resumeData.education || [],
            skills: resumeData.skills || [],
            sectionTitles: resumeData.sectionTitles || { experience: 'Experience', education: 'Education', skills: 'Skills' },
            language: language || 'en',
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
        });

        const page = await browser.newPage();

        // Set content and wait for rendering
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF with A4 size
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true,
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

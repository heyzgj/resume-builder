"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { PanelLeft, Settings, Download, Sparkles, ChevronDown, Layout, Plus, Globe, Check, Loader2 } from "lucide-react";
import { BasicsForm } from "@/components/editor/BasicsForm";
import { ExperienceForm } from "@/components/editor/ExperienceForm";
import { EducationForm } from "@/components/editor/EducationForm";
import { SkillsForm } from "@/components/editor/SkillsForm";
import { CustomSectionForm } from "@/components/editor/CustomSectionForm";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ClientOnly } from "@/components/ClientOnly";
import { useResumeStore } from "@/lib/store";

export default function Home() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { settings, updateSettings, addCustomSection, switchToLanguageDefaults, data } = useResumeStore();

  const handleSmartFit = () => {
    updateSettings({ smartFitEnabled: !settings.smartFitEnabled });
  };

  // Puppeteer-based PDF Export (Direct Download)
  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      // Send resume data to API for server-side rendering
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: data,
          language: settings.language,
          filename: `${data.basics.name.replace(/\s+/g, '_')}_Resume.pdf`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`PDF导出失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-[var(--bg-warm)] overflow-hidden">

      {/* LEFT: Editor Panel (40%) */}
      <section className="w-[40%] min-w-[360px] h-full border-r border-[var(--border-soft)] flex flex-col bg-[var(--card-surface)] z-10 shadow-[var(--shadow-sm)]">
        <header className="h-14 border-b border-[var(--border-softer)] flex items-center justify-between px-6 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 text-neutral-800 font-medium">
            <PanelLeft size={18} />
            <span className="text-sm tracking-tight">编辑器</span>
          </div>
          <button className="p-2 hover:bg-neutral-100 rounded-md transition-colors text-neutral-500">
            <Settings size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 mx-auto w-full">
          <ClientOnly>
            <div className="space-y-5 pb-24">
              <BasicsForm />
              <ExperienceForm />
              <EducationForm />
              <SkillsForm />

              {/* Render Custom Sections */}
              {data.customSections.map((section) => (
                <CustomSectionForm key={section.id} sectionId={section.id} />
              ))}

              {/* Add Custom Section Button */}
              <button
                onClick={() => {
                  console.log("Adding custom section...");
                  addCustomSection();
                }}
                className="w-full py-3 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-[var(--text-muted)] text-xs font-semibold tracking-wide hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus size={14} /> 添加模块
              </button>
            </div>
          </ClientOnly>
        </div>
      </section>

      {/* RIGHT: Preview Panel (60%) */}
      <section className="flex-1 h-full bg-[var(--bg-warm-subtle)] relative flex flex-col min-w-0">

        {/* ===== CONSOLIDATED TOOLBAR ===== */}
        <div className="h-14 flex items-center justify-between px-5 bg-white border-b border-neutral-200 z-30 gap-4 flex-shrink-0">

          {/* LEFT: Design Controls */}
          <div className="flex items-center gap-3">

            {/* Smart Fit Toggle (On-Demand) */}
            <ClientOnly>
              <button
                onClick={handleSmartFit}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all border",
                  settings.smartFitEnabled
                    ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 text-amber-800 shadow-sm"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
                title="Click to auto-fit content to one page"
              >
                <Sparkles size={13} />
                {settings.smartFitEnabled ? 'Smart Fit ✓' : 'Smart Fit'}
              </button>
            </ClientOnly>

            <div className="w-px h-5 bg-neutral-200"></div>

            {/* Templates Dropdown with Language Options */}
            <ClientOnly>
              <div className="relative">
                <button
                  onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                >
                  <Layout size={13} />
                  {settings.language === 'zh' ? '中文模板' : 'English Template'}
                  <ChevronDown size={12} className={clsx("ml-1 opacity-50 transition-transform", templateMenuOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {templateMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Language / 语言
                    </div>
                    <button
                      onClick={() => {
                        switchToLanguageDefaults('en');
                        setTemplateMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[11px] flex items-center justify-between hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={12} /> English (Goldman Sachs Style)
                      </span>
                      {settings.language === 'en' && <Check size={12} className="text-green-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchToLanguageDefaults('zh');
                        setTemplateMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[11px] flex items-center justify-between hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={12} /> 中文 (中金公司风格)
                      </span>
                      {settings.language === 'zh' && <Check size={12} className="text-green-600" />}
                    </button>
                    <div className="border-t border-neutral-100 my-1"></div>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      More Templates (Coming Soon)
                    </div>
                    <div className="px-3 py-2 text-[11px] text-neutral-400">
                      Consulting, Tech, Creative...
                    </div>
                  </div>
                )}
              </div>
            </ClientOnly>

          </div>

          {/* RIGHT: Export - Direct Download */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={clsx(
              "px-4 py-2 text-[11px] font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2 flex-shrink-0",
              isExporting
                ? "bg-neutral-400 text-white cursor-wait"
                : "bg-neutral-900 text-white hover:bg-black"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download size={13} /> Download PDF
              </>
            )}
          </button>
        </div>

        {/* ===== PREVIEW AREA ===== */}
        <div className="flex-1 overflow-auto flex justify-center bg-[var(--bg-warm-subtle)] py-6">
          <ClientOnly>
            <div
              ref={previewRef}
              className="shadow-2xl bg-white origin-top print:shadow-none print:transform-none"
              style={{ transform: 'scale(1)', transformOrigin: 'top center' }}
            >
              <ResumePreview />
            </div>
          </ClientOnly>
        </div>
      </section>

      {/* Click outside to close template menu */}
      {templateMenuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setTemplateMenuOpen(false)}
        />
      )}
    </main>
  );
}

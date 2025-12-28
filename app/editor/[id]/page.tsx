"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowLeft, Check, Loader2, Download, Sparkles, Plus, Lock, Unlock, ChevronDown } from "lucide-react";
import { BasicsForm } from "@/components/editor/BasicsForm";
import { ExperienceForm } from "@/components/editor/ExperienceForm";
import { EducationForm } from "@/components/editor/EducationForm";
import { SkillsForm } from "@/components/editor/SkillsForm";
import { CustomSectionForm } from "@/components/editor/CustomSectionForm";
import { SectionPickerModal } from "@/components/editor/SectionPickerModal";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ClientOnly } from "@/components/ClientOnly";
import { useResumeStore } from "@/lib/store";
import { resumeDB } from "@/lib/db";
import { DesignSettings, SectionType } from "@/lib/types";

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.id as string;

    const previewRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showSectionPicker, setShowSectionPicker] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [resumeTitle, setResumeTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [previewPagination, setPreviewPagination] = useState<{ pageCount: number; lastPageFill: number | null } | null>(null);
    const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
    const layoutMenuRef = useRef<HTMLDivElement>(null);

    const {
        data,
        settings,
        updateSettings,
        addCustomSection,
        moveSection,
        setData,
        setSettings
    } = useResumeStore();

    // Load resume on mount
    useEffect(() => {
        const loadResume = async () => {
            try {
                const doc = await resumeDB.getById(resumeId);
                if (doc) {
                    setData(doc.data);
                    setSettings(doc.settings);
                    setResumeTitle(doc.title);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Failed to load resume:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        loadResume();
    }, [resumeId, setData, setSettings]);

    // Auto-save with debounce
    useEffect(() => {
        if (loading || notFound) return;

        setSaveStatus('unsaved');
        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                await resumeDB.update(resumeId, {
                    data,
                    settings,
                    title: resumeTitle
                });
                setSaveStatus('saved');
            } catch (error) {
                console.error("Auto-save failed:", error);
                setSaveStatus('unsaved');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [data, settings, resumeTitle, resumeId, loading, notFound]);

    const isLayoutLocked = settings.layoutLocked;
    const layoutMode = settings.layoutMode;

    const setLayoutMode = (mode: typeof settings.layoutMode) => {
        if (isLayoutLocked) return;

        if (mode === "onePage") {
            updateSettings({ layoutMode: mode, smartFitEnabled: true });
            return;
        }

        updateSettings({ layoutMode: mode, smartFitEnabled: false });
    };

    const setDensityPreset = (preset: "comfortable" | "standard" | "compact") => {
        const density = preset === "comfortable" ? 1.1 : preset === "compact" ? 0.9 : 1.0;
        const patch: Partial<DesignSettings> = { density };

        // If the user manually adjusts density in "recommended", freeze auto-tuning.
        if (layoutMode === "recommended" && !isLayoutLocked) {
            patch.layoutLocked = true;
        }

        updateSettings(patch);
    };

    const toggleLayoutLock = () => {
        updateSettings({ layoutLocked: !isLayoutLocked });
    };

    const densityPreset: "comfortable" | "standard" | "compact" =
        settings.density >= 1.05 ? "comfortable" : settings.density <= 0.95 ? "compact" : "standard";

    // Auto-tune density in "recommended" mode based on preview fill.
    useEffect(() => {
        if (layoutMode !== "recommended") return;
        if (isLayoutLocked) return;
        if (!previewPagination) return;

        const { pageCount, lastPageFill } = previewPagination;
        let desiredDensity = 1.0;

        if (pageCount > 1) {
            desiredDensity = 0.9;
        } else if (lastPageFill != null) {
            // Only loosen spacing when the page is clearly underfilled to avoid oscillations near the page boundary.
            if (lastPageFill < 0.6) desiredDensity = 1.1;
            else if (lastPageFill > 0.97) desiredDensity = 0.9;
        }

        const patches: Partial<DesignSettings> = {};
        if (settings.smartFitEnabled) patches.smartFitEnabled = false;
        if (Math.abs(settings.density - desiredDensity) > 0.01) patches.density = desiredDensity;

        if (Object.keys(patches).length > 0) {
            updateSettings(patches);
        }
    }, [isLayoutLocked, layoutMode, previewPagination, settings.density, settings.smartFitEnabled, updateSettings]);

    useEffect(() => {
        if (!layoutMenuOpen) return;

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (layoutMenuRef.current?.contains(target)) return;
            setLayoutMenuOpen(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLayoutMenuOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [layoutMenuOpen]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeData: data,
                    language: settings.language,
                    settings,
                    filename: `${data.basics.name.replace(/\s+/g, '_')}_简历.pdf`
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.basics.name.replace(/\s+/g, '_')}_简历.pdf`;
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)]">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-canvas)]">
                <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">简历未找到</h1>
                <p className="text-sm text-[var(--text-muted)] mb-6">该简历可能已被删除</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-xl"
                >
                    返回主页
                </button>
            </div>
        );
    }

    const sectionOrder = data.sectionOrder || ['experience', 'education', 'skills'];

    return (
        <main className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)]">
            {/* LEFT: Editor Panel */}
            <section className="w-[40%] min-w-[360px] h-full border-r border-[var(--border-soft)] flex flex-col bg-[var(--card-surface)] z-10 shadow-[var(--shadow-sm)]">
                {/* Editor Header */}
                <header className="h-14 border-b border-[var(--border-softer)] flex items-center justify-between px-4 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-warm)] rounded-lg transition-all"
                            title="返回主页"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <input
                            type="text"
                            value={resumeTitle}
                            onChange={(e) => setResumeTitle(e.target.value)}
                            className="text-sm font-semibold text-[var(--text-primary)] bg-transparent border-none outline-none focus:bg-[var(--bg-warm)] px-2 py-1 rounded-md transition-colors"
                            placeholder="简历标题"
                        />
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center gap-2 text-xs">
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                <Loader2 size={12} className="animate-spin" />
                                保存中...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-1.5 text-[var(--accent-primary)]">
                                <Check size={12} />
                                已保存
                            </span>
                        )}
                        {saveStatus === 'unsaved' && (
                            <span className="flex items-center gap-1.5 text-amber-500">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                未保存
                            </span>
                        )}
                    </div>
                </header>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    <ClientOnly>
                        <div className="space-y-4">
                            <BasicsForm />

                            {sectionOrder.map((sectionKey, index) => {
                                const getMoveProps = () => ({
                                    onMoveUp: () => moveSection(sectionKey, 'up'),
                                    onMoveDown: () => moveSection(sectionKey, 'down'),
                                    canMoveUp: index > 0,
                                    canMoveDown: index < sectionOrder.length - 1
                                });

                                if (sectionKey === 'experience') {
                                    return <ExperienceForm key={sectionKey} {...getMoveProps()} />;
                                }
                                if (sectionKey === 'education') {
                                    return <EducationForm key={sectionKey} {...getMoveProps()} />;
                                }
                                if (sectionKey === 'skills') {
                                    return <SkillsForm key={sectionKey} {...getMoveProps()} />;
                                }
                                if (data.customSections.find(s => s.id === sectionKey)) {
                                    return <CustomSectionForm key={sectionKey} sectionId={sectionKey} {...getMoveProps()} />;
                                }
                                return null;
                            })}

                            {/* Add Section Button */}
                            <button
                                onClick={() => setShowSectionPicker(true)}
                                className="w-full py-3 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-[var(--text-muted)] text-xs font-semibold tracking-wide hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> 添加模块
                            </button>
                        </div>
                    </ClientOnly>
                </div>
            </section>

            {/* RIGHT: Preview Panel */}
            <section className="flex-1 h-full flex flex-col bg-[var(--bg-canvas)]">
                {/* Preview Header - Updated to match design system */}
                <header className="h-14 flex items-center justify-between px-5 bg-white/90 backdrop-blur-sm border-b border-[var(--border-softer)] z-30 gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Smart Layout (Popover) */}
                        <div ref={layoutMenuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setLayoutMenuOpen((v) => !v)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border",
                                    layoutMenuOpen
                                        ? "bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-muted)] shadow-[var(--shadow-sm)]"
                                        : "bg-white text-[var(--text-secondary)] border-[var(--border-soft)] hover:bg-[var(--bg-warm)] hover:border-[var(--border-medium)]"
                                )}
                                aria-haspopup="menu"
                                aria-expanded={layoutMenuOpen}
                            >
                                <Sparkles size={14} />
                                智能排版
                                <ChevronDown
                                    size={14}
                                    className={clsx("transition-transform duration-200", layoutMenuOpen && "rotate-180")}
                                />
                            </button>

                            {layoutMenuOpen && (
                                <div
                                    className="absolute left-0 top-full mt-2 w-[360px] bg-[var(--card-surface)] border border-[var(--border-soft)] rounded-xl shadow-[var(--shadow-md)] p-3 z-50"
                                    role="menu"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-[var(--text-primary)]">版式设置</div>
                                        <button
                                            type="button"
                                            onClick={toggleLayoutLock}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200",
                                                isLayoutLocked
                                                    ? "bg-[var(--card-surface)] text-[var(--text-primary)] border-[var(--border-soft)] shadow-[var(--shadow-sm)]"
                                                    : "bg-white text-[var(--text-secondary)] border-[var(--border-soft)] hover:bg-[var(--bg-warm)]"
                                            )}
                                            title={isLayoutLocked ? "已锁定版式" : "锁定版式"}
                                        >
                                            {isLayoutLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                            锁定
                                        </button>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <div className="text-[11px] font-medium text-[var(--text-muted)] mb-1">目标页数</div>
                                            <div className="flex items-center gap-1 bg-[var(--bg-warm-subtle)] border border-[var(--border-soft)] rounded-xl p-1">
                                                {(
                                                    [
                                                        { key: "recommended", label: "推荐" },
                                                        { key: "onePage", label: "1页" },
                                                        { key: "twoPage", label: "2页" },
                                                        { key: "unlimited", label: "不限" },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        disabled={isLayoutLocked}
                                                        onClick={() => setLayoutMode(opt.key)}
                                                        className={clsx(
                                                            "flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200",
                                                            isLayoutLocked
                                                                ? "opacity-60 cursor-not-allowed"
                                                                : "hover:bg-[var(--bg-warm)]",
                                                            layoutMode === opt.key
                                                                ? "bg-[var(--card-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                                                                : "text-[var(--text-secondary)]"
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[11px] font-medium text-[var(--text-muted)] mb-1">密度</div>
                                            <div className="flex items-center gap-1 bg-[var(--bg-warm-subtle)] border border-[var(--border-soft)] rounded-xl p-1">
                                                {(
                                                    [
                                                        { key: "comfortable", label: "舒适" },
                                                        { key: "standard", label: "标准" },
                                                        { key: "compact", label: "紧凑" },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        disabled={isLayoutLocked}
                                                        onClick={() => setDensityPreset(opt.key)}
                                                        className={clsx(
                                                            "flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200",
                                                            isLayoutLocked
                                                                ? "opacity-60 cursor-not-allowed"
                                                                : "hover:bg-[var(--bg-warm)]",
                                                            densityPreset === opt.key
                                                                ? "bg-[var(--card-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                                                                : "text-[var(--text-secondary)]"
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <div
                                                className={clsx(
                                                    "px-2.5 py-1.5 rounded-full border text-[11px] font-medium tabular-nums select-none",
                                                    layoutMode === "onePage" && (previewPagination?.pageCount ?? 1) > 1
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-white text-[var(--text-secondary)] border-[var(--border-soft)]"
                                                )}
                                                title={previewPagination ? "页数与最后一页填充率" : "正在计算分页..."}
                                            >
                                                {previewPagination
                                                    ? `${previewPagination.pageCount}页 · ${Math.round((previewPagination.lastPageFill ?? 0) * 100)}%`
                                                    : "计算中..."}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setLayoutMenuOpen(false)}
                                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-warm)] transition-all duration-200"
                                            >
                                                完成
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className={clsx(
                                "px-2.5 py-1.5 rounded-full border text-[11px] font-medium tabular-nums select-none",
                                layoutMode === "onePage" && (previewPagination?.pageCount ?? 1) > 1
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-white text-[var(--text-secondary)] border-[var(--border-soft)]"
                            )}
                            title={previewPagination ? "页数与最后一页填充率" : "正在计算分页..."}
                        >
                            {previewPagination
                                ? `${previewPagination.pageCount}页 · ${Math.round((previewPagination.lastPageFill ?? 0) * 100)}%`
                                : "计算中..."}
                        </div>

                        {isLayoutLocked && (
                            <div className="text-[var(--text-muted)]" title="已锁定版式">
                                <Lock size={14} />
                            </div>
                        )}
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                            isExporting
                                ? "bg-[var(--bg-warm)] text-[var(--text-muted)] cursor-not-allowed"
                                : "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md"
                        )}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                导出中...
                            </>
                        ) : (
                            <>
                                <Download size={14} />
                                下载 PDF
                            </>
                        )}
                    </button>
                </header>

                {/* Preview Content - Centered with proper sizing for large screens */}
                <div className="flex-1 overflow-auto flex items-start justify-center p-6 lg:p-10">
                    <div
                        ref={previewRef}
                        className="flex-shrink-0"
                        style={{ maxWidth: '210mm' }}
                    >
                        <ClientOnly>
                            <ResumePreview onPaginationChange={setPreviewPagination} />
                        </ClientOnly>
                    </div>
                </div>
            </section>

            <SectionPickerModal
                isOpen={showSectionPicker}
                onClose={() => setShowSectionPicker(false)}
                onSelect={(type: SectionType, title: string) => addCustomSection(type, title)}
            />
        </main>
    );
}

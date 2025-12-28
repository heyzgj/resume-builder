"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Download, Upload, Sparkles, Loader2, X } from "lucide-react";
import { resumeDB, ResumeDocument } from "@/lib/db";
import { clsx } from "clsx";
import { ResumeData } from "@/lib/types";

// Template definitions
interface Template {
    id: string;
    name: string;
    description: string;
    preview: 'blank' | 'zh' | 'en';
    data: ResumeData;
    language: 'zh' | 'en';
}

const TEMPLATES: Template[] = [
    {
        id: 'blank',
        name: '空白简历',
        description: '从零开始，自由创作',
        preview: 'blank',
        language: 'zh',
        data: {
            basics: { name: "你的姓名", email: "email@example.com", phone: "138-0000-0000", location: "城市", socials: [] },
            sectionTitles: { experience: "工作经历", education: "教育背景", skills: "技能与兴趣" },
            sectionOrder: ['experience', 'education', 'skills'],
            experience: [],
            education: [],
            skills: [],
            customSections: []
        }
    },
    {
        id: 'ibank-zh',
        name: '投行中文简历',
        description: '专业金融行业模板',
        preview: 'zh',
        language: 'zh',
        data: {
            basics: {
                name: "张三",
                email: "zhangsan@example.com",
                phone: "138-0000-0000",
                location: "上海",
                socials: [{ platform: "LinkedIn", url: "linkedin.com/in/zhangsan" }]
            },
            sectionTitles: { experience: "工作经历", education: "教育背景", skills: "技能与兴趣" },
            sectionOrder: ['experience', 'education', 'skills'],
            experience: [
                {
                    id: "1",
                    company: "中金公司 (CICC)",
                    role: "投资银行部分析师",
                    location: "上海",
                    startDate: "2023.06",
                    endDate: "至今",
                    description: "<ul><li><p>参与执行累计规模超50亿元的A股IPO项目，负责搭建估值模型</p></li><li><p>独立完成3个并购交易的尽职调查报告</p></li><li><p>制作投资者路演材料和管理层访谈纪要</p></li></ul>",
                    visible: true
                }
            ],
            education: [
                {
                    id: "1",
                    school: "清华大学",
                    degree: "金融学学士",
                    location: "北京",
                    startDate: "2019.09",
                    endDate: "2023.06",
                    gpa: "GPA 3.8/4.0，专业排名前5%",
                    visible: true
                }
            ],
            skills: [
                { id: "1", name: "专业技能", items: ["财务建模", "Excel/VBA", "Python", "Wind金融终端"] },
                { id: "2", name: "语言能力", items: ["普通话（母语）", "英语（流利）"] }
            ],
            customSections: []
        }
    },
    {
        id: 'ibank-en',
        name: '投行英文简历',
        description: 'Goldman Sachs Style',
        preview: 'en',
        language: 'en',
        data: {
            basics: {
                name: "Alex Sterling",
                email: "alex.sterling@example.com",
                phone: "+1 (555) 123-4567",
                location: "New York, NY",
                socials: [{ platform: "LinkedIn", url: "linkedin.com/in/alexsterling" }]
            },
            sectionTitles: { experience: "Professional Experience", education: "Education", skills: "Skills & Interests" },
            sectionOrder: ['experience', 'education', 'skills'],
            experience: [
                {
                    id: "1",
                    company: "Goldman Sachs",
                    role: "Investment Banking Analyst",
                    location: "New York, NY",
                    startDate: "Jul 2023",
                    endDate: "Present",
                    description: "<ul><li><p>Advised on $500M+ M&A transactions across TMT and Healthcare sectors</p></li><li><p>Built complex financial models (DCF, LBO, Merger Models)</p></li><li><p>Prepared investor presentations and management decks</p></li></ul>",
                    visible: true
                }
            ],
            education: [
                {
                    id: "1",
                    school: "Columbia University",
                    degree: "B.S. in Economics, Minor in Computer Science",
                    location: "New York, NY",
                    startDate: "Sep 2019",
                    endDate: "May 2023",
                    gpa: "GPA: 3.9/4.0, Magna Cum Laude",
                    visible: true
                }
            ],
            skills: [
                { id: "1", name: "Technical", items: ["Financial Modeling", "Excel/VBA", "Python", "Bloomberg Terminal"] },
                { id: "2", name: "Languages", items: ["English (Native)", "Mandarin (Proficient)"] }
            ],
            customSections: []
        }
    }
];

const getDefaultSettings = (lang: 'zh' | 'en') => ({
    language: lang,
    smartFitEnabled: false,
    density: 1.0,
    accentColor: "#000000",
    paperSize: lang === 'zh' ? "A4" as const : "Letter" as const,
    layoutMode: "recommended" as const,
    layoutLocked: false
});

// Generate auto-naming based on date
const generateAutoName = (templateName: string): string => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${month}月${day}日 - ${templateName}`;
};

// Format relative time
const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
};

// Template Preview Component
function TemplatePreview({ type }: { type: 'blank' | 'zh' | 'en' }) {
    if (type === 'blank') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-warm)]">
                <Plus size={24} className="text-[var(--border-soft)]" />
            </div>
        );
    }

    const isZh = type === 'zh';
    return (
        <div className="w-full h-full bg-white p-3 text-[6px] leading-tight overflow-hidden">
            <div className="text-center mb-2">
                <div className="font-bold text-[8px]">{isZh ? '张三' : 'Alex Sterling'}</div>
                <div className="text-[5px] text-gray-500">{isZh ? '138-0000-0000 · zhangsan@example.com' : '+1 555 123-4567 · alex@example.com'}</div>
            </div>
            <div className="border-b border-gray-200 pb-1 mb-1">
                <div className="font-bold uppercase tracking-wider text-[5px] text-gray-600">{isZh ? '工作经历' : 'Experience'}</div>
            </div>
            <div className="mb-1">
                <div className="font-semibold">{isZh ? '中金公司' : 'Goldman Sachs'}</div>
                <div className="text-gray-500">{isZh ? '投资银行部分析师' : 'IB Analyst'}</div>
            </div>
            <div className="border-b border-gray-200 pb-1 mb-1">
                <div className="font-bold uppercase tracking-wider text-[5px] text-gray-600">{isZh ? '教育背景' : 'Education'}</div>
            </div>
            <div>
                <div className="font-semibold">{isZh ? '清华大学' : 'Columbia University'}</div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [resumes, setResumes] = useState<ResumeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const docs = await resumeDB.getAll();
            setResumes(docs);
        } catch (error) {
            console.error("Failed to load resumes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = async (template: Template) => {
        const id = await resumeDB.create(
            generateAutoName(template.name),
            template.data,
            getDefaultSettings(template.language)
        );
        setShowTemplatePicker(false);
        router.push(`/editor/${id}`);
    };

    const handleRename = async (id: string) => {
        if (renameValue.trim()) {
            await resumeDB.update(id, { title: renameValue.trim() });
            await loadResumes();
        }
        setRenamingId(null);
        setRenameValue("");
        setActiveMenu(null);
    };

    const startRename = (doc: ResumeDocument) => {
        setRenamingId(doc.id);
        setRenameValue(doc.title);
        setActiveMenu(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm("确定要删除这份简历吗？")) {
            await resumeDB.delete(id);
            await loadResumes();
        }
        setActiveMenu(null);
    };

    const handleExportPDF = async (doc: ResumeDocument) => {
        setExportingId(doc.id);
        setActiveMenu(null);

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeData: doc.data,
                    language: doc.settings.language,
                    settings: doc.settings,
                    filename: `${doc.title.replace(/\s+/g, '_')}.pdf`
                }),
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`PDF导出失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setExportingId(null);
        }
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = JSON.parse(text);
                await resumeDB.create(
                    imported.title || "导入的简历",
                    imported.data,
                    imported.settings || getDefaultSettings('zh')
                );
                await loadResumes();
            } catch (error) {
                console.error("Import failed:", error);
                alert("导入失败，请检查文件格式");
            }
        };
        input.click();
    };

    return (
        <div className="min-h-screen bg-[var(--bg-canvas)]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[var(--border-softer)]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                            Resume Builder
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Title & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                            我的简历
                        </h1>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            {resumes.length} 份简历
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleImport}
                            className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-soft)] rounded-xl hover:bg-[var(--bg-warm)] hover:border-[var(--border-medium)] transition-all duration-200 flex items-center gap-2"
                        >
                            <Upload size={16} />
                            导入
                        </button>
                        <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-xl hover:bg-[var(--accent-hover)] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <Plus size={16} />
                            新建简历
                        </button>
                    </div>
                </div>

                {/* Resume List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-warm)] flex items-center justify-center">
                            <FileText size={28} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            还没有简历
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-6">
                            选择一个模板，创建你的第一份简历
                        </p>
                        <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-xl hover:bg-[var(--accent-hover)] transition-all duration-200 inline-flex items-center gap-2"
                        >
                            <Plus size={16} />
                            新建简历
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {resumes.map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={clsx("group relative", activeMenu === doc.id && "z-50")}
                                >
                                    <div
                                        onClick={() => !renamingId && router.push(`/editor/${doc.id}`)}
                                        className={clsx(
                                            "relative bg-white rounded-2xl border border-[var(--border-softer)] p-5",
                                            !renamingId && "cursor-pointer hover:border-[var(--border-soft)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
                                            "transition-all duration-200"
                                        )}
                                    >
                                        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-[var(--accent-muted)] group-hover:bg-[var(--accent-primary)] transition-colors" />

                                        <div className="flex items-center justify-between pl-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    {renamingId === doc.id ? (
                                                        <input
                                                            type="text"
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            onBlur={() => handleRename(doc.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleRename(doc.id);
                                                                if (e.key === 'Escape') {
                                                                    setRenamingId(null);
                                                                    setRenameValue("");
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="text-base font-semibold text-[var(--text-primary)] bg-[var(--bg-warm)] px-2 py-1 rounded-md border border-[var(--accent-primary)] outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                                                            {doc.title}
                                                        </h3>
                                                    )}
                                                    {index === 0 && !renamingId && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-subtle)] rounded-full uppercase tracking-wider">
                                                            最近
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                                    <span>{doc.data.sectionOrder?.length || 3} 个模块</span>
                                                    <span className="w-1 h-1 rounded-full bg-[var(--border-soft)]" />
                                                    <span>{formatRelativeTime(new Date(doc.updatedAt))}</span>
                                                </div>
                                            </div>

                                            <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                {exportingId === doc.id ? (
                                                    <div className="p-2">
                                                        <Loader2 size={18} className="animate-spin text-[var(--accent-primary)]" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                                                        className={clsx(
                                                            "p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-warm)] rounded-lg transition-all",
                                                            activeMenu === doc.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                        )}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                )}

                                                <AnimatePresence>
                                                    {activeMenu === doc.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[var(--border-soft)] py-1.5 min-w-[160px] z-[100]"
                                                        >
                                                            <button
                                                                onClick={() => startRename(doc)}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-warm)] flex items-center gap-3 transition-colors"
                                                            >
                                                                <Pencil size={14} />
                                                                重命名
                                                            </button>
                                                            <button
                                                                onClick={() => handleExportPDF(doc)}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-warm)] flex items-center gap-3 transition-colors"
                                                            >
                                                                <Download size={14} />
                                                                下载 PDF
                                                            </button>
                                                            <div className="my-1.5 border-t border-[var(--border-softer)]" />
                                                            <button
                                                                onClick={() => handleDelete(doc.id)}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                                删除
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {resumes.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-[var(--border-softer)] text-center">
                        <p className="text-xs text-[var(--text-muted)]">
                            数据保存在本地浏览器中 · 支持导出备份
                        </p>
                    </div>
                )}
            </main>

            {/* Click outside to close menu */}
            {activeMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
            )}

            {/* Template Picker Modal */}
            <AnimatePresence>
                {showTemplatePicker && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[100]"
                            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                            onClick={() => setShowTemplatePicker(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="fixed inset-0 flex items-center justify-center z-[101] p-6"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-softer)]">
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--text-primary)]">选择模板</h2>
                                        <p className="text-sm text-[var(--text-muted)] mt-0.5">选择一个模板开始你的简历</p>
                                    </div>
                                    <button
                                        onClick={() => setShowTemplatePicker(false)}
                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-warm)] rounded-lg transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Template Cards */}
                                <div className="p-8">
                                    <div className="grid grid-cols-3 gap-5">
                                        {TEMPLATES.map((template) => (
                                            <motion.button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                whileHover={{ y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="group text-left bg-white rounded-xl border-2 border-[var(--border-softer)] hover:border-[var(--accent-primary)] transition-all duration-200 overflow-hidden"
                                            >
                                                {/* Preview */}
                                                <div className="aspect-[3/4] border-b border-[var(--border-softer)] overflow-hidden">
                                                    <TemplatePreview type={template.preview} />
                                                </div>

                                                {/* Info */}
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                                        {template.description}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

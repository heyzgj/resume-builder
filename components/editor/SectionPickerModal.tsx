"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Award, Briefcase, GraduationCap, Palette, PenTool } from "lucide-react";
import { SectionType } from "@/lib/types";

interface SectionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: SectionType, title: string) => void;
}

const sectionTemplates: {
    type: SectionType;
    title: string;
    description: string;
    icon: React.ReactNode;
}[] = [
        {
            type: "summary",
            title: "个人总结",
            description: "3-4句概括你的职业定位和核心价值",
            icon: <FileText size={20} />
        },
        {
            type: "honors",
            title: "荣誉奖项",
            description: "奖项、证书、资质认证",
            icon: <Award size={20} />
        },
        {
            type: "portfolio",
            title: "项目经历",
            description: "项目作品、开源贡献、出版物",
            icon: <Briefcase size={20} />
        },
        {
            type: "custom",
            title: "自定义模块",
            description: "自由编辑的通用模块",
            icon: <PenTool size={20} />
        }
    ];

export const SectionPickerModal: React.FC<SectionPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect
}) => {
    const handleSelect = (type: SectionType, title: string) => {
        onSelect(type, title);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[100]"
                        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-softer)]">
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                    添加模块
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-warm)] rounded-md transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Template Grid */}
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {sectionTemplates.map((template) => (
                                    <button
                                        key={template.type}
                                        onClick={() => handleSelect(template.type, template.title)}
                                        className="flex flex-col items-start p-4 rounded-xl border border-[var(--border-soft)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-warm)] transition-all duration-200 text-left group"
                                    >
                                        <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3 group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                            {template.icon}
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                                            {template.title}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                                            {template.description}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Footer hint */}
                            <div className="px-6 py-3 bg-[var(--bg-warm-subtle)] border-t border-[var(--border-softer)]">
                                <p className="text-[10px] text-[var(--text-muted)] text-center">
                                    选择模块类型后可自定义标题和内容
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { RichTextEditor } from "./RichTextEditor";
import { ExperienceItem, HonorItem } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomSectionFormProps {
    sectionId: string;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export const CustomSectionForm: React.FC<CustomSectionFormProps> = ({
    sectionId,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false
}) => {
    const {
        data,
        removeCustomSection,
        updateCustomSectionTitle,
        updateCustomSectionContent,
        updateCustomSectionItem,
        addCustomSectionItem,
        removeCustomSectionItem,
        updateCustomSectionHonor,
        addCustomSectionHonor,
        removeCustomSectionHonor
    } = useResumeStore();

    const section = data.customSections.find(s => s.id === sectionId);
    if (!section) return null;

    // Render different content based on section type
    const renderContent = () => {
        switch (section.type) {
            case 'summary':
                return (
                    <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            个人总结
                        </label>
                        <textarea
                            value={section.content || ''}
                            onChange={(e) => updateCustomSectionContent(sectionId, e.target.value)}
                            placeholder="用3-4句话概括你的职业定位、核心技能和职业目标..."
                            className="w-full bg-[var(--card-surface)] border border-[var(--border-soft)] rounded-lg p-3 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-200 min-h-[100px] leading-relaxed resize-y placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                );

            case 'honors':
                return (
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {(section.honors || []).map((honor) => (
                                <motion.div
                                    key={honor.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group relative rounded-lg p-4 bg-[var(--bg-warm)] hover:bg-[var(--bg-warm-subtle)] border border-[var(--border-softer)] hover:border-[var(--border-soft)] transition-all duration-200"
                                >
                                    <button
                                        onClick={() => removeCustomSectionHonor(sectionId, honor.id)}
                                        className="absolute top-3 right-3 p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Input
                                            label="奖项/证书名称"
                                            value={honor.title}
                                            onChange={(e) => updateCustomSectionHonor(sectionId, { ...honor, title: e.target.value })}
                                            placeholder="如：国家奖学金"
                                        />
                                        <Input
                                            label="颁发机构"
                                            value={honor.issuer}
                                            onChange={(e) => updateCustomSectionHonor(sectionId, { ...honor, issuer: e.target.value })}
                                            placeholder="如：教育部"
                                        />
                                        <Input
                                            label="日期"
                                            value={honor.date}
                                            onChange={(e) => updateCustomSectionHonor(sectionId, { ...honor, date: e.target.value })}
                                            placeholder="如：2023.12"
                                        />
                                    </div>
                                    {/* Optional description */}
                                    <div className="mt-3">
                                        <RichTextEditor
                                            value={honor.description || ""}
                                            onChange={(val) => updateCustomSectionHonor(sectionId, { ...honor, description: val })}
                                            placeholder="描述奖项详情（可选）..."
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <button
                            onClick={() => addCustomSectionHonor(sectionId)}
                            className="w-full py-2.5 border border-dashed border-[var(--border-soft)] rounded-lg text-[var(--text-muted)] text-xs font-semibold hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} /> 添加奖项
                        </button>
                    </div>
                );

            case 'portfolio':
            case 'custom':
            default:
                return (
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {(section.items || []).map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group relative rounded-lg p-5 bg-[var(--bg-warm)] hover:bg-[var(--bg-warm-subtle)] border border-[var(--border-softer)] hover:border-[var(--border-soft)] transition-all duration-200"
                                >
                                    <button
                                        onClick={() => removeCustomSectionItem(sectionId, item.id)}
                                        className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Input
                                            label={section.type === 'portfolio' ? "项目名称" : "标题"}
                                            value={item.company}
                                            onChange={(e) => updateCustomSectionItem(sectionId, { ...item, company: e.target.value })}
                                            placeholder={section.type === 'portfolio' ? "如：用户增长分析系统" : "如：标题名称"}
                                        />
                                        <Input
                                            label={section.type === 'portfolio' ? "角色/技术栈" : "副标题"}
                                            value={item.role}
                                            onChange={(e) => updateCustomSectionItem(sectionId, { ...item, role: e.target.value })}
                                            placeholder={section.type === 'portfolio' ? "如：产品负责人 | Python, SQL" : "如：副标题"}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <Input
                                            label="开始时间"
                                            value={item.startDate}
                                            onChange={(e) => updateCustomSectionItem(sectionId, { ...item, startDate: e.target.value })}
                                            placeholder="如：2023.06"
                                        />
                                        <Input
                                            label="结束时间"
                                            value={item.endDate}
                                            onChange={(e) => updateCustomSectionItem(sectionId, { ...item, endDate: e.target.value })}
                                            placeholder="如：2024.01 或 至今"
                                        />
                                    </div>
                                    <RichTextEditor
                                        value={item.description}
                                        onChange={(val) => updateCustomSectionItem(sectionId, { ...item, description: val })}
                                        placeholder="描述你的工作内容和成果..."
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <button
                            onClick={() => addCustomSectionItem(sectionId)}
                            className="w-full py-2.5 border border-dashed border-[var(--border-soft)] rounded-lg text-[var(--text-muted)] text-xs font-semibold hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} /> 添加条目
                        </button>
                    </div>
                );
        }
    };

    return (
        <SectionWrapper
            title={section.title}
            onTitleChange={(newTitle) => updateCustomSectionTitle(sectionId, newTitle)}
            onDelete={() => removeCustomSection(sectionId)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
        >
            {renderContent()}
        </SectionWrapper>
    );
};

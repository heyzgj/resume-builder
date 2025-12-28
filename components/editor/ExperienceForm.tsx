"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { RichTextEditor } from "./RichTextEditor";
import { ExperienceItem } from "@/lib/types";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExperienceFormProps {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false
}) => {
    const { data, updateExperience, addExperience, removeExperience, moveExperience, clearExperience, updateSectionTitle } = useResumeStore();
    const { experience, sectionTitles } = data;

    const handleChange = (id: string, field: keyof ExperienceItem, value: any) => {
        const item = experience.find((i) => i.id === id);
        if (item) {
            updateExperience({ ...item, [field]: value });
        }
    };

    return (
        <SectionWrapper
            title={sectionTitles?.experience || "工作经历"}
            onTitleChange={(newTitle) => updateSectionTitle('experience', newTitle)}
            onDelete={clearExperience}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
        >
            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {experience.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative rounded-lg p-5 bg-[var(--bg-warm)] hover:bg-[var(--bg-warm-subtle)] border border-[var(--border-softer)] hover:border-[var(--border-soft)] transition-all duration-200"
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => moveExperience(item.id, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="上移"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    onClick={() => moveExperience(item.id, 'down')}
                                    disabled={index === experience.length - 1}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="下移"
                                >
                                    <ChevronDown size={14} />
                                </button>
                                <button
                                    onClick={() => removeExperience(item.id)}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="删除此经历"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Input
                                    label="公司名称"
                                    value={item.company}
                                    onChange={(e) => handleChange(item.id, "company", e.target.value)}
                                    placeholder="如：中金公司"
                                />
                                <Input
                                    label="职位"
                                    value={item.role}
                                    onChange={(e) => handleChange(item.id, "role", e.target.value)}
                                    placeholder="如：投资银行部分析师"
                                />
                                <Input
                                    label="开始日期"
                                    value={item.startDate}
                                    onChange={(e) => handleChange(item.id, "startDate", e.target.value)}
                                    placeholder="2023.06"
                                />
                                <Input
                                    label="结束日期"
                                    value={item.endDate}
                                    onChange={(e) => handleChange(item.id, "endDate", e.target.value)}
                                    placeholder="至今"
                                />
                                <div className="col-span-2">
                                    <Input
                                        label="工作地点"
                                        value={item.location}
                                        onChange={(e) => handleChange(item.id, "location", e.target.value)}
                                        placeholder="上海"
                                    />
                                </div>
                            </div>

                            <RichTextEditor
                                value={item.description}
                                onChange={(newValue) => handleChange(item.id, "description", newValue)}
                                placeholder="描述你的工作职责和成就..."
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={addExperience}
                    className="w-full py-3 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-[var(--text-muted)] text-xs font-semibold tracking-wide hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> 添加经历
                </button>
            </div>
        </SectionWrapper>
    );
};


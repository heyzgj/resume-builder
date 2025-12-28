"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { EducationItem } from "@/lib/types";
import { RichTextEditor } from "./RichTextEditor";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EducationFormProps {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export const EducationForm: React.FC<EducationFormProps> = ({
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false
}) => {
    const { data, updateEducation, addEducation, removeEducation, moveEducation, clearEducation, updateSectionTitle } = useResumeStore();
    const { education, sectionTitles } = data;

    const handleChange = (id: string, field: keyof EducationItem, value: any) => {
        const item = education.find((i) => i.id === id);
        if (item) {
            updateEducation({ ...item, [field]: value });
        }
    };

    return (
        <SectionWrapper
            title={sectionTitles?.education || "教育背景"}
            onTitleChange={(newTitle) => updateSectionTitle('education', newTitle)}
            onDelete={clearEducation}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
        >
            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {education.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative rounded-lg p-5 bg-[var(--bg-warm)] hover:bg-[var(--bg-warm-subtle)] border border-[var(--border-softer)] hover:border-[var(--border-soft)] transition-all duration-200"
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => moveEducation(item.id, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="上移"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    onClick={() => moveEducation(item.id, 'down')}
                                    disabled={index === education.length - 1}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="下移"
                                >
                                    <ChevronDown size={14} />
                                </button>
                                <button
                                    onClick={() => removeEducation(item.id)}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="删除此教育经历"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="学校名称"
                                    value={item.school}
                                    onChange={(e) => handleChange(item.id, "school", e.target.value)}
                                    placeholder="如：清华大学"
                                />
                                <Input
                                    label="学位 / 专业"
                                    value={item.degree}
                                    onChange={(e) => handleChange(item.id, "degree", e.target.value)}
                                    placeholder="如：金融学学士"
                                />
                                <Input
                                    label="开始日期"
                                    value={item.startDate}
                                    onChange={(e) => handleChange(item.id, "startDate", e.target.value)}
                                    placeholder="2019.09"
                                />
                                <Input
                                    label="结束日期"
                                    value={item.endDate}
                                    onChange={(e) => handleChange(item.id, "endDate", e.target.value)}
                                    placeholder="2023.06"
                                />
                                <Input
                                    label="所在城市"
                                    value={item.location}
                                    onChange={(e) => handleChange(item.id, "location", e.target.value)}
                                    placeholder="北京"
                                />
                                <Input
                                    label="GPA / 荣誉"
                                    value={item.gpa || ""}
                                    onChange={(e) => handleChange(item.id, "gpa", e.target.value)}
                                    placeholder="如：GPA 3.8/4.0，专业前5%"
                                />
                            </div>

                            {/* Description (optional) */}
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                    相关课程 / 活动（可选）
                                </label>
                                <RichTextEditor
                                    value={item.description || ""}
                                    onChange={(newValue) => handleChange(item.id, "description", newValue)}
                                    placeholder="相关课程、学术活动、社团经历等..."
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={addEducation}
                    className="w-full py-3 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-[var(--text-muted)] text-xs font-semibold tracking-wide hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> 添加教育经历
                </button>
            </div>
        </SectionWrapper>
    );
};


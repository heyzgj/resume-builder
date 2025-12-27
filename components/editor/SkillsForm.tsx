"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { SkillCategory } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SkillsFormProps {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false
}) => {
    const { data, updateSectionTitle, updateSkillCategory, addSkillCategory, removeSkillCategory, clearSkills } = useResumeStore();
    const { skills, sectionTitles } = data;

    const handleNameChange = (id: string, name: string) => {
        const category = skills.find((c) => c.id === id);
        if (category) {
            updateSkillCategory({ ...category, name });
        }
    };

    const handleItemsChange = (id: string, itemsString: string) => {
        const category = skills.find((c) => c.id === id);
        if (category) {
            // Split by Chinese/English comma and trim whitespace
            const items = itemsString.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
            updateSkillCategory({ ...category, items });
        }
    };

    return (
        <SectionWrapper
            title={sectionTitles?.skills || "技能与兴趣"}
            onTitleChange={(newTitle) => updateSectionTitle('skills', newTitle)}
            onDelete={clearSkills}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
        >
            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {skills.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative rounded-lg p-4 bg-[var(--bg-warm)] hover:bg-[var(--bg-warm-subtle)] border border-[var(--border-softer)] hover:border-[var(--border-soft)] transition-all duration-200"
                        >
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => removeSkillCategory(category.id)}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="删除此类别"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <Input
                                    label="类别名称"
                                    value={category.name}
                                    onChange={(e) => handleNameChange(category.id, e.target.value)}
                                    placeholder="如：专业技能、语言能力"
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wide">
                                        技能列表
                                        <span className="ml-2 text-[10px] text-[var(--text-placeholder)]">用逗号分隔</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--card-surface)] border border-[var(--border-soft)] rounded-lg p-3 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-200"
                                        value={category.items.join("，")}
                                        onChange={(e) => handleItemsChange(category.id, e.target.value)}
                                        placeholder="Python，Excel，Bloomberg..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={addSkillCategory}
                    className="w-full py-3 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-[var(--text-muted)] text-xs font-semibold tracking-wide hover:bg-[var(--bg-warm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> 添加技能类别
                </button>
            </div>
        </SectionWrapper>
    );
};


"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SkillsForm = () => {
    const { data, updateSectionTitle } = useResumeStore();
    const { skills, sectionTitles } = data;

    // For now, we'll just display skills. Full CRUD can be added later.
    // This is a read-only display of skills categories.

    return (
        <SectionWrapper
            title={sectionTitles?.skills || "Skills & Interests"}
            onTitleChange={(newTitle) => updateSectionTitle('skills', newTitle)}
        >
            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {skills.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative border border-neutral-100 rounded-lg p-4 bg-neutral-50/30 hover:bg-neutral-50 hover:shadow-sm transition-all"
                        >
                            <div className="space-y-3">
                                <Input
                                    label="Category Name"
                                    value={category.name}
                                    onChange={() => { }}
                                    placeholder="e.g., Technical, Languages"
                                    disabled
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                                        Skills (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-neutral-900 transition-colors"
                                        value={category.items.join(", ")}
                                        disabled
                                        placeholder="Python, Excel, Bloomberg..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {skills.length === 0 && (
                    <div className="text-center py-6 text-neutral-400 text-xs">
                        No skills added yet. Edit skills in the store or add them via custom section.
                    </div>
                )}
            </div>
        </SectionWrapper>
    );
};

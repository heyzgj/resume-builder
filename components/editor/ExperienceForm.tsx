"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { ExperienceItem } from "@/lib/types";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ExperienceForm = () => {
    const { data, updateExperience, addExperience, removeExperience, updateSectionTitle } = useResumeStore();
    const { experience, sectionTitles } = data;

    const handleChange = (id: string, field: keyof ExperienceItem, value: any) => {
        const item = experience.find((i) => i.id === id);
        if (item) {
            updateExperience({ ...item, [field]: value });
        }
    };

    return (
        <SectionWrapper
            title={sectionTitles?.experience || "Work Experience"}
            onTitleChange={(newTitle) => updateSectionTitle('experience', newTitle)}
        >
            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {experience.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative border border-neutral-100 rounded-lg p-5 bg-neutral-50/30 hover:bg-neutral-50 hover:shadow-sm transition-all"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeExperience(item.id)}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Input
                                    label="Company"
                                    value={item.company}
                                    onChange={(e) => handleChange(item.id, "company", e.target.value)}
                                    placeholder="Company Name"
                                />
                                <Input
                                    label="Role"
                                    value={item.role}
                                    onChange={(e) => handleChange(item.id, "role", e.target.value)}
                                    placeholder="Job Title"
                                />
                                <Input
                                    label="Start Date"
                                    value={item.startDate}
                                    onChange={(e) => handleChange(item.id, "startDate", e.target.value)}
                                    placeholder="YYYY-MM"
                                />
                                <Input
                                    label="End Date"
                                    value={item.endDate}
                                    onChange={(e) => handleChange(item.id, "endDate", e.target.value)}
                                    placeholder="Present"
                                />
                                <div className="col-span-2">
                                    <Input
                                        label="Location"
                                        value={item.location}
                                        onChange={(e) => handleChange(item.id, "location", e.target.value)}
                                        placeholder="City, State"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Description (Bullets)</label>
                                <textarea
                                    className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-neutral-900 transition-colors min-h-[100px] leading-relaxed resize-y"
                                    value={item.description}
                                    onChange={(e) => handleChange(item.id, "description", e.target.value)}
                                    placeholder="• Achieved X result by doing Y..."
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={addExperience}
                    className="w-full py-3 border border-dashed border-neutral-300 rounded-lg text-neutral-500 text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 hover:border-neutral-400 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Add Experience
                </button>
            </div>
        </SectionWrapper>
    );
};

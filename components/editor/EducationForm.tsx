"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";
import { EducationItem } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const EducationForm = () => {
    const { data, updateEducation, addEducation, removeEducation, updateSectionTitle } = useResumeStore();
    const { education, sectionTitles } = data;

    const handleChange = (id: string, field: keyof EducationItem, value: any) => {
        const item = education.find((i) => i.id === id);
        if (item) {
            updateEducation({ ...item, [field]: value });
        }
    };

    return (
        <SectionWrapper
            title={sectionTitles?.education || "Education"}
            onTitleChange={(newTitle) => updateSectionTitle('education', newTitle)}
        >
            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {education.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative border border-neutral-100 rounded-lg p-5 bg-neutral-50/30 hover:bg-neutral-50 hover:shadow-sm transition-all"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeEducation(item.id)}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="School"
                                    value={item.school}
                                    onChange={(e) => handleChange(item.id, "school", e.target.value)}
                                    placeholder="University Name"
                                />
                                <Input
                                    label="Degree"
                                    value={item.degree}
                                    onChange={(e) => handleChange(item.id, "degree", e.target.value)}
                                    placeholder="Degree, Major"
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
                                    placeholder="YYYY-MM"
                                />
                                <Input
                                    label="Location"
                                    value={item.location}
                                    onChange={(e) => handleChange(item.id, "location", e.target.value)}
                                    placeholder="City, State"
                                />
                                <Input
                                    label="GPA / Honors"
                                    value={item.gpa || ""}
                                    onChange={(e) => handleChange(item.id, "gpa", e.target.value)}
                                    placeholder="e.g. 3.9/4.0"
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={addEducation}
                    className="w-full py-3 border border-dashed border-neutral-300 rounded-lg text-neutral-500 text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 hover:border-neutral-400 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Add Education
                </button>
            </div>
        </SectionWrapper>
    );
};

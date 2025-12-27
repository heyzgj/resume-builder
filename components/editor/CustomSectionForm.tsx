"use client";

import { useResumeStore } from "@/lib/store";
import { SectionWrapper } from "./SectionWrapper";

interface CustomSectionFormProps {
    sectionId: string;
}

export const CustomSectionForm: React.FC<CustomSectionFormProps> = ({ sectionId }) => {
    const { data, removeCustomSection, updateCustomSectionTitle } = useResumeStore();

    const section = data.customSections.find(s => s.id === sectionId);
    if (!section) return null;

    return (
        <SectionWrapper
            title={section.title}
            onTitleChange={(newTitle) => updateCustomSectionTitle(sectionId, newTitle)}
            onDelete={() => removeCustomSection(sectionId)}
        >
            <div className="space-y-4">
                <p className="text-[var(--text-muted)] text-xs">
                    自定义模块内容编辑功能开发中...
                </p>
                {/* Future: Add items list with add/edit/delete functionality */}
            </div>
        </SectionWrapper>
    );
};

"use client";

import { useResumeStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { SectionWrapper } from "./SectionWrapper";

export const BasicsForm = () => {
    const { data, updateBasics } = useResumeStore();
    const { basics } = data;

    const handleChange = (field: keyof typeof basics, value: string) => {
        updateBasics({ [field]: value });
    };

    return (
        <SectionWrapper title="个人信息" defaultOpen={true} canDelete={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="姓名"
                    value={basics.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="如：李明华"
                />
                <Input
                    label="邮箱"
                    value={basics.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="ming@example.com"
                />
                <Input
                    label="电话"
                    value={basics.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="138-1234-5678"
                />
                <Input
                    label="城市"
                    value={basics.location || ""}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="上海市"
                />
                <div className="col-span-2">
                    <Input
                        label="个人网站 / LinkedIn"
                        value={basics.socials[0]?.url || ""}
                        onChange={(e) => {
                            const newSocials = [...basics.socials];
                            if (newSocials.length > 0) {
                                newSocials[0] = { ...newSocials[0], url: e.target.value };
                            } else {
                                newSocials.push({ platform: "LinkedIn", url: e.target.value });
                            }
                            updateBasics({ socials: newSocials });
                        }}
                        placeholder="linkedin.com/in/..."
                    />
                </div>
            </div>
        </SectionWrapper>
    );
};


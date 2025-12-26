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
        <SectionWrapper title="Personal Details" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Full Name"
                    value={basics.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Alex Sterling"
                />
                <Input
                    label="Email"
                    value={basics.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="alex@example.com"
                />
                <Input
                    label="Phone"
                    value={basics.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                />
                <Input
                    label="Location"
                    value={basics.location || ""}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="New York, NY"
                />
                <div className="col-span-2">
                    <Input
                        label="Website / LinkedIn"
                        value={basics.socials[0]?.url || ""}
                        onChange={(e) => {
                            // Simplified social update for MVP
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


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, DesignSettings, ExperienceItem, EducationItem, SkillCategory, SectionType, HonorItem } from './types';

interface ResumeState {
    data: ResumeData;
    settings: DesignSettings;

    // Data Loading (for DB integration)
    setData: (data: ResumeData) => void;
    setSettings: (settings: DesignSettings) => void;

    // Actions
    updateBasics: (basics: Partial<ResumeData['basics']>) => void;
    updateExperience: (item: ExperienceItem) => void;
    addExperience: () => void;
    removeExperience: (id: string) => void;
    moveExperience: (id: string, direction: 'up' | 'down') => void;
    clearExperience: () => void;
    updateEducation: (item: EducationItem) => void;
    addEducation: () => void;
    removeEducation: (id: string) => void;
    moveEducation: (id: string, direction: 'up' | 'down') => void;
    clearEducation: () => void;
    updateSettings: (settings: Partial<DesignSettings>) => void;

    // Skills Actions
    updateSkillCategory: (item: SkillCategory) => void;
    addSkillCategory: () => void;
    removeSkillCategory: (id: string) => void;
    clearSkills: () => void;

    // Customization Actions
    updateSectionTitle: (key: string, title: string) => void;
    moveSection: (sectionKey: string, direction: 'up' | 'down') => void;
    addCustomSection: (type: SectionType, title: string) => void;
    removeCustomSection: (sectionId: string) => void;
    updateCustomSectionTitle: (sectionId: string, title: string) => void;
    updateCustomSectionContent: (sectionId: string, content: string) => void;
    updateCustomSectionItem: (sectionId: string, item: ExperienceItem) => void;
    addCustomSectionItem: (sectionId: string) => void;
    removeCustomSectionItem: (sectionId: string, itemId: string) => void;
    updateCustomSectionHonor: (sectionId: string, honor: HonorItem) => void;
    addCustomSectionHonor: (sectionId: string) => void;
    removeCustomSectionHonor: (sectionId: string, honorId: string) => void;
    switchToLanguageDefaults: (lang: 'en' | 'zh') => void;
}

// English Default Data (Goldman Sachs / McKinsey style)
const initialDataEN: ResumeData = {
    basics: {
        name: "Alex Sterling",
        email: "alex.sterling@example.com",
        phone: "+1 (555) 123-4567",
        location: "New York, NY",
        socials: [
            { platform: "LinkedIn", url: "linkedin.com/in/alexsterling" }
        ],
    },
    sectionTitles: {
        experience: "Professional Experience",
        education: "Education",
        skills: "Skills & Interests"
    },
    sectionOrder: ['experience', 'education', 'skills'],
    customSections: [],
    experience: [
        {
            id: "1",
            company: "Goldman Sachs",
            role: "Investment Banking Analyst",
            location: "New York, NY",
            startDate: "Jun 2023",
            endDate: "Present",
            description: "<ul><li>Advised on $500M+ M&A transactions across TMT and Healthcare sectors, executing comprehensive valuation analyses.</li><li>Built complex financial models (DCF, LBO, Merger Model) to support strategic recommendations for Fortune 500 clients.</li><li>Prepared investor presentations and management decks for capital markets transactions totaling $1.2B.</li></ul>",
            visible: true
        }
    ],
    education: [
        {
            id: "1",
            school: "Columbia University",
            degree: "B.A. in Economics, Minor in Computer Science",
            location: "New York, NY",
            startDate: "Sep 2019",
            endDate: "May 2023",
            gpa: "3.9/4.0, Magna Cum Laude",
            visible: true
        }
    ],
    skills: [
        {
            id: "1",
            name: "Technical",
            items: ["Financial Modeling (DCF, LBO, M&A)", "Excel/VBA", "Python", "Bloomberg Terminal", "FactSet"]
        },
        {
            id: "2",
            name: "Languages",
            items: ["English (Native)", "Mandarin (Professional)"]
        }
    ]
};

// Chinese Default Data (中金 / 麦肯锡中国 style)
const initialDataZH: ResumeData = {
    basics: {
        name: "李明华",
        email: "minghua.li@example.com",
        phone: "138-1234-5678",
        location: "上海市",
        socials: [
            { platform: "LinkedIn", url: "linkedin.com/in/minghuali" }
        ],
    },
    sectionTitles: {
        experience: "工作经历",
        education: "教育背景",
        skills: "技能与兴趣"
    },
    sectionOrder: ['experience', 'education', 'skills'],
    customSections: [],
    experience: [
        {
            id: "1",
            company: "中金公司 (CICC)",
            role: "投资银行部分析师",
            location: "上海",
            startDate: "2023.06",
            endDate: "至今",
            description: "<ul><li>参与执行累计规模超50亿元的A股IPO项目，负责搭建估值模型，完成行业可比公司分析</li><li>独立完成3个并购交易的尽职调查报告，协助项目组识别关键风险点并提出解决方案</li><li>制作投资者路演材料和管理层访谈纪要，支持项目顺利推进</li></ul>",
            visible: true
        }
    ],
    education: [
        {
            id: "1",
            school: "清华大学",
            degree: "金融学学士",
            location: "北京",
            startDate: "2019.09",
            endDate: "2023.06",
            gpa: "GPA 3.8/4.0，专业排名前5%",
            visible: true
        }
    ],
    skills: [
        {
            id: "1",
            name: "专业技能",
            items: ["财务建模 (DCF, LBO, 并购模型)", "Excel/VBA", "Python", "Wind金融终端", "Bloomberg"]
        },
        {
            id: "2",
            name: "语言能力",
            items: ["普通话（母语）", "英语（流利）", "CET-6 600+"]
        }
    ]
};

// Start with English as default
const initialData = initialDataEN;

const initialSettings: DesignSettings = {
    language: 'en',
    smartFitEnabled: false,
    density: 1.0,
    accentColor: '#000000',
    paperSize: 'Letter'
};

export const useResumeStore = create<ResumeState>()(
    persist(
        (set) => ({
            data: initialData,
            settings: initialSettings,

            // Data Loading
            setData: (newData) => set({ data: newData }),
            setSettings: (newSettings) => set({ settings: newSettings }),

            updateBasics: (updates) =>
                set((state) => ({ data: { ...state.data, basics: { ...state.data.basics, ...updates } } })),

            updateExperience: (updatedItem) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.map((item) =>
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    }
                })),

            addExperience: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: [
                            {
                                id: crypto.randomUUID(),
                                company: "New Company",
                                role: "Role",
                                location: "Location",
                                startDate: "",
                                endDate: "",
                                description: "",
                                visible: true
                            },
                            ...state.data.experience
                        ]
                    }
                })),

            removeExperience: (id) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.filter((item) => item.id !== id)
                    }
                })),

            moveExperience: (id, direction) =>
                set((state) => {
                    const items = [...state.data.experience];
                    const index = items.findIndex(item => item.id === id);
                    if (index === -1) return state;

                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    if (newIndex < 0 || newIndex >= items.length) return state;

                    // Swap items
                    [items[index], items[newIndex]] = [items[newIndex], items[index]];
                    return { data: { ...state.data, experience: items } };
                }),

            updateEducation: (updatedItem) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        education: state.data.education.map((item) =>
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    }
                })),

            addEducation: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        education: [
                            {
                                id: crypto.randomUUID(),
                                school: "New School",
                                degree: "Degree",
                                location: "Location",
                                startDate: "",
                                endDate: "",
                                visible: true
                            },
                            ...state.data.education
                        ]
                    }
                })),

            removeEducation: (id) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        education: state.data.education.filter((item) => item.id !== id)
                    }
                })),

            moveEducation: (id, direction) =>
                set((state) => {
                    const items = [...state.data.education];
                    const index = items.findIndex(item => item.id === id);
                    if (index === -1) return state;

                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    if (newIndex < 0 || newIndex >= items.length) return state;

                    // Swap items
                    [items[index], items[newIndex]] = [items[newIndex], items[index]];
                    return { data: { ...state.data, education: items } };
                }),

            updateSettings: (updates) =>
                set((state) => ({ settings: { ...state.settings, ...updates } })),

            updateSectionTitle: (key, title) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        sectionTitles: { ...state.data.sectionTitles, [key]: title }
                    }
                })),

            moveSection: (sectionKey, direction) =>
                set((state) => {
                    const order = [...(state.data.sectionOrder || ['experience', 'education', 'skills'])];
                    const index = order.indexOf(sectionKey);
                    if (index === -1) return state;

                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    if (newIndex < 0 || newIndex >= order.length) return state;

                    // Swap sections
                    [order[index], order[newIndex]] = [order[newIndex], order[index]];
                    return { data: { ...state.data, sectionOrder: order } };
                }),

            // Skills CRUD
            updateSkillCategory: (updatedItem) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        skills: state.data.skills.map((item) =>
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    }
                })),

            addSkillCategory: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        skills: [
                            ...state.data.skills,
                            {
                                id: crypto.randomUUID(),
                                name: "新类别",
                                items: []
                            }
                        ]
                    }
                })),

            removeSkillCategory: (id) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        skills: state.data.skills.filter((item) => item.id !== id)
                    }
                })),

            // Section-level clear actions
            clearExperience: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: []
                    }
                })),

            clearEducation: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        education: []
                    }
                })),

            clearSkills: () =>
                set((state) => ({
                    data: {
                        ...state.data,
                        skills: []
                    }
                })),

            addCustomSection: (type, title) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    data: {
                        ...state.data,
                        sectionOrder: [...(state.data.sectionOrder || ['experience', 'education', 'skills']), id],
                        customSections: [
                            ...state.data.customSections,
                            {
                                id,
                                type,
                                title,
                                content: type === 'summary' ? '' : undefined,
                                items: (type === 'portfolio' || type === 'custom') ? [] : undefined,
                                honors: type === 'honors' ? [] : undefined,
                                visible: true
                            }
                        ]
                    }
                }));
            },

            removeCustomSection: (sectionId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        sectionOrder: state.data.sectionOrder.filter(key => key !== sectionId),
                        customSections: state.data.customSections.filter(section => section.id !== sectionId)
                    }
                })),

            updateCustomSectionTitle: (sectionId, title) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, title }
                                : section
                        )
                    }
                })),

            updateCustomSectionContent: (sectionId, content) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, content }
                                : section
                        )
                    }
                })),

            updateCustomSectionItem: (sectionId, updatedItem) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, items: (section.items || []).map(item => item.id === updatedItem.id ? updatedItem : item) }
                                : section
                        )
                    }
                })),

            addCustomSectionItem: (sectionId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? {
                                    ...section,
                                    items: [
                                        ...(section.items || []),
                                        {
                                            id: crypto.randomUUID(),
                                            company: "",
                                            role: "",
                                            location: "",
                                            startDate: "",
                                            endDate: "",
                                            description: "",
                                            visible: true
                                        }
                                    ]
                                }
                                : section
                        )
                    }
                })),

            removeCustomSectionItem: (sectionId, itemId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, items: (section.items || []).filter(item => item.id !== itemId) }
                                : section
                        )
                    }
                })),

            updateCustomSectionHonor: (sectionId, updatedHonor) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, honors: (section.honors || []).map(honor => honor.id === updatedHonor.id ? updatedHonor : honor) }
                                : section
                        )
                    }
                })),

            addCustomSectionHonor: (sectionId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? {
                                    ...section,
                                    honors: [
                                        ...(section.honors || []),
                                        {
                                            id: crypto.randomUUID(),
                                            title: "",
                                            issuer: "",
                                            date: ""
                                        }
                                    ]
                                }
                                : section
                        )
                    }
                })),

            removeCustomSectionHonor: (sectionId, honorId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, honors: (section.honors || []).filter(honor => honor.id !== honorId) }
                                : section
                        )
                    }
                })),

            switchToLanguageDefaults: (lang) =>
                set(() => ({
                    data: lang === 'zh' ? initialDataZH : initialDataEN,
                    settings: { language: lang, smartFitEnabled: false, density: 1.0, accentColor: '#000000', paperSize: lang === 'zh' ? 'A4' : 'Letter' }
                })),

        }),
        {
            name: 'resume-storage',
        }
    )
);

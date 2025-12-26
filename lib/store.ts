
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, DesignSettings, ExperienceItem, EducationItem } from './types';

interface ResumeState {
    data: ResumeData;
    settings: DesignSettings;

    // Actions
    updateBasics: (basics: Partial<ResumeData['basics']>) => void;
    updateExperience: (item: ExperienceItem) => void;
    addExperience: () => void;
    removeExperience: (id: string) => void;
    updateEducation: (item: EducationItem) => void;
    addEducation: () => void;
    removeEducation: (id: string) => void;
    updateSettings: (settings: Partial<DesignSettings>) => void;

    // Customization Actions
    updateSectionTitle: (key: string, title: string) => void;
    addCustomSection: () => void;
    updateCustomSectionItem: (sectionId: string, item: ExperienceItem) => void;
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

            updateSettings: (updates) =>
                set((state) => ({ settings: { ...state.settings, ...updates } })),

            updateSectionTitle: (key, title) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        sectionTitles: { ...state.data.sectionTitles, [key]: title }
                    }
                })),

            addCustomSection: () => {
                const id = crypto.randomUUID();
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: [
                            ...state.data.customSections,
                            {
                                id,
                                title: "Custom Section",
                                items: [],
                                visible: true
                            }
                        ]
                    }
                }));
            },

            updateCustomSectionItem: (sectionId, updatedItem) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        customSections: state.data.customSections.map(section =>
                            section.id === sectionId
                                ? { ...section, items: section.items.map(item => item.id === updatedItem.id ? updatedItem : item) }
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

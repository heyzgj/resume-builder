export type SocialLink = {
  platform: string;
  url: string;
  icon?: string; // Lucide icon name
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | "Present";
  description: string; // Markdown/HTML support
  visible: boolean;
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
  visible: boolean;
};

export type SkillCategory = {
  id: string;
  name: string; // e.g. "Languages", "Technical"
  items: string[];
};

// Honor/Award item for the honors section
export type HonorItem = {
  id: string;
  title: string;      // 奖项名称
  issuer: string;     // 颁发机构
  date: string;       // 日期
};

// Section template types
export type SectionType =
  | 'summary'     // 个人总结 - single text block
  | 'skills'      // 专业技能 - category + items (reuses existing)
  | 'education'   // 教育经历 - (reuses existing)
  | 'honors'      // 荣誉奖项 - title + issuer + date
  | 'portfolio'   // 作品集 - similar to experience
  | 'custom';     // 自定义 - similar to experience

export type ResumeData = {
  basics: {
    name: string;
    email: string;
    phone: string;
    website?: string;
    socials: SocialLink[];
    location?: string;
  };
  // Dynamic Section Titles
  sectionTitles: {
    experience: string;
    education: string;
    skills: string;
    [key: string]: string; // For custom sections
  };
  // Section order: array of section keys ('experience', 'education', 'skills', or custom section id)
  sectionOrder: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  languages?: { language: string; proficiency: string }[];
  projects?: ExperienceItem[];

  // Custom Sections (now with type for different templates)
  customSections: {
    id: string;
    type: SectionType;
    title: string;
    content?: string;           // For summary type
    items?: ExperienceItem[];   // For portfolio/custom types
    honors?: HonorItem[];       // For honors type
    visible: boolean;
  }[];
};

export type DesignSettings = {
  language: "en" | "zh"; // English or Chinese format
  smartFitEnabled: boolean; // On-demand Smart Fit
  density: number; // 0.8 to 1.2
  accentColor: string; // Hex code
  paperSize: "A4" | "Letter";
};

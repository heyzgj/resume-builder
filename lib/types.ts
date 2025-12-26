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

// Reusing ExperienceItem for dynamic lists is okay, but generally custom sections might be simpler text.
// For premium MVP, we will stick to ExperienceItem structure (Title, Subtitle, Date, Desc) as it's versatile.

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
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  languages?: { language: string; proficiency: string }[];
  projects?: ExperienceItem[];

  // Custom Sections
  customSections: {
    id: string;
    title: string;
    items: ExperienceItem[]; // Reusing standard item structure
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

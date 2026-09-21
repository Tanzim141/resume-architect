export type TemplateId = 'classic' | 'modern' | 'creative';

export interface EducationInput {
  id: string;
  degree: string;
  school: string;
  startYear: string;
  endYear: string;
  cgpa?: string;
  scoreType?: 'CGPA' | 'GPA';
}

export interface UserInput {
  templateId: TemplateId;
  photo?: string; // Base64 string for the image
  showPhotoInClassic?: boolean; // Optional: whether to show photo in Classic ATS
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  customLinks?: { id: string; name: string; url: string }[];
  jobTitle: string;
  experienceLevel: string;
  skills: string;
  experience: string;
  education: EducationInput[];
  projects: string;
  certifications?: string;
  achievements?: string;
  languages?: string;
}

export interface GeneratedResume {
  professionalSummary: string;
  workExperience: {
    role: string;
    company: string;
    location: string;
    duration: string;
    points: string[];
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    year: string;
    details?: string;
    cgpa?: string;
    scoreType?: 'CGPA' | 'GPA';
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications?: string[];
  achievements?: string[];
  languages?: string[];
}

export enum AppState {
  EDITING,
  GENERATING,
  VIEWING,
}
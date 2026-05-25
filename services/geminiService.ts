import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInput, GeneratedResume } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const resumeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    professionalSummary: {
      type: Type.STRING,
      description: "A compelling 3-4 line professional summary optimized for ATS.",
    },
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          location: { type: Type.STRING },
          duration: { type: Type.STRING },
          points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Action-oriented bullet points using strong verbs. Maximum 3-4 bullet points per role. Each point must be concise (max 15-20 words).",
          },
        },
        required: ["role", "company", "duration", "points"],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "e.g., Technical, Soft Skills, Tools" },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["category", "items"],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          location: { type: Type.STRING },
          year: { type: Type.STRING },
          details: { type: Type.STRING },
          cgpa: { type: Type.STRING },
          scoreType: { type: Type.STRING, description: "Must be exactly 'CGPA' or 'GPA'" },
        },
        required: ["degree", "institution", "year"],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["professionalSummary", "workExperience", "skills", "education"],
};

export const chatWithAI = async (message: string, history: Array<{role: "user"|"model", parts: {text: string}[]}> = []): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
         systemInstruction: "You are a helpful AI assistant inside a Resume Builder application. Answer questions about resumes, career advice, and general topics, and communicate in whatever language the user speaks.",
         temperature: 0.7,
      },
      history: history
    });
    
    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};

export const generateResumeContent = async (input: UserInput): Promise<GeneratedResume> => {
  // Enhanced formatting for education to ensure institution is captured
  const educationText = input.education
    .map(edu => {
      const yearStr = edu.endYear && edu.endYear !== edu.startYear 
        ? `${edu.startYear} - ${edu.endYear}` 
        : edu.startYear;
      const cgpaStr = edu.cgpa ? `, ${edu.scoreType || 'CGPA'}: ${edu.cgpa}` : '';
      return `Degree: ${edu.degree}, Institution: ${edu.school}, Year: ${yearStr}${cgpaStr}`;
    })
    .join('; ');

  const prompt = `
    You are a professional resume writer and HR expert.
    Create a modern, ATS-friendly resume based on the information provided below.
    
    Rules:
    - Use clear, professional English
    - Avoid unnecessary words
    - Optimize for Applicant Tracking Systems (ATS)
    - Use strong action verbs (e.g., Spearheaded, Orchestrated, Developed)
    - Do not fabricate fake experience, but polish the existing input to sound professional.
    - Make it suitable for international job markets.
    - KEEP WORK EXPERIENCE CONCISE: Strictly limit to 3-4 bullet points per role. Each point must be a single, impactful sentence (max 15-20 words).

    Input Data:
    Full Name: ${input.fullName}
    Job Title: ${input.jobTitle}
    Experience Level: ${input.experienceLevel}
    GitHub: ${input.github}
    Portfolio/Website: ${input.website}
    Skills: ${input.skills}
    Work Experience Input: ${input.experience}
    Education Input: ${educationText}
    Projects Input: ${input.projects}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: resumeSchema,
        temperature: 0.4, // Keep it relatively deterministic but creative enough for phrasing
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedResume;
  } catch (error) {
    console.error("Error generating resume:", error);
    throw error;
  }
};
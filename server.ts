import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

function buildFallbackResume(input: any, educationText: string): any {
  const rawSkills = (input?.skills || "").split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
  const formattedSkills = rawSkills.length > 0 ? rawSkills : ["Problem Solving", "Team Leadership", "Project Management"];
  
  const rawExperience = (input?.experience || "").trim();
  const expBlocks = rawExperience ? rawExperience.split(/\n\s*\n/).filter(Boolean) : [];
  
  const workExperience = expBlocks.length > 0 
    ? expBlocks.map((block: string) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const role = lines[0] || input?.jobTitle || "Professional Role";
        const company = lines[1] || "Organization";
        const duration = lines[2] || "Recent";
        const customPoints = lines.slice(3);
        const points = customPoints.length > 0 
          ? customPoints 
          : [
              `Spearheaded core initiatives and delivered high-quality solutions for key deliverables.`,
              `Collaborated with cross-functional teams to optimize performance and streamline operational workflows.`,
              `Implemented industry best practices to improve overall team productivity and output quality.`
            ];
        return {
          role,
          company,
          location: "Remote / On-site",
          duration,
          points: points.slice(0, 4),
        };
      })
    : [
        {
          role: input?.jobTitle || "Professional",
          company: "Work Experience",
          location: "Global",
          duration: "Present",
          points: [
            `Executed key responsibilities in ${input?.jobTitle || 'the position'} with high attention to detail.`,
            `Utilized core competencies in ${formattedSkills.slice(0, 3).join(', ')} to drive organizational outcomes.`
          ]
        }
      ];

  const parsedEdu = (input?.education && Array.isArray(input.education) && input.education.length > 0)
    ? input.education.map((edu: any) => ({
        degree: edu.degree || "Degree",
        institution: edu.school || "Institution",
        location: "Graduated",
        year: edu.endYear && edu.endYear !== edu.startYear ? `${edu.startYear} - ${edu.endYear}` : (edu.startYear || "Present"),
        cgpa: edu.cgpa ? `${edu.scoreType || 'CGPA'}: ${edu.cgpa}` : undefined,
        scoreType: edu.scoreType || 'CGPA'
      }))
    : [{
        degree: "Education / Training",
        institution: educationText || "University",
        location: "",
        year: "Completed",
        scoreType: "CGPA"
      }];

  const rawProjects = (input?.projects || "").trim();
  const projBlocks = rawProjects ? rawProjects.split(/\n\s*\n/).filter(Boolean) : [];
  const projects = projBlocks.length > 0
    ? projBlocks.map((block: string) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        return {
          name: lines[0] || "Featured Project",
          description: lines.slice(1).join(" ") || "Developed and executed a strategic project driving measurable results.",
          technologies: formattedSkills.slice(0, 4)
        };
      })
    : [
        {
          name: `${input?.jobTitle || 'Professional'} Portfolio Project`,
          description: `Engineered an end-to-end project leveraging ${formattedSkills.slice(0, 3).join(', ')}.`,
          technologies: formattedSkills.slice(0, 3)
        }
      ];

  const professionalSummary = `Results-driven ${input?.experienceLevel || 'Accomplished'} ${input?.jobTitle || 'Professional'} with expertise in ${formattedSkills.slice(0, 3).join(', ')}. Demonstrated ability to streamline workflows, deliver high-impact projects, and collaborate effectively across cross-functional teams.`;

  return {
    professionalSummary,
    workExperience,
    skills: [
      {
        category: "Technical & Core Skills",
        items: formattedSkills
      }
    ],
    education: parsedEdu,
    projects
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cors());

  // Wait to initialize GoogleGenAI. It will use process.env.GEMINI_API_KEY
  // We'll initialize it safely upon request to fail fast if missing.
  let ai: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
         throw new Error("GEMINI_API_KEY is missing");
      }
      ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  }

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

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const genAI = getGenAI();
      const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-pro-preview"];
      let text = "";
      let lastErr = null;

      for (const model of modelsToTry) {
        try {
          const chat = genAI.chats.create({
            model: model,
            config: {
               systemInstruction: "You are a helpful AI assistant inside a Resume Builder application. Answer questions about resumes, career advice, and general topics, and communicate in whatever language the user speaks.",
               temperature: 0.7,
            },
            history: history || []
          });
          const response = await chat.sendMessage({ message });
          if (response.text) {
            text = response.text;
            break;
          }
        } catch (err: any) {
          lastErr = err;
        }
      }
      
      if (!text) {
        throw lastErr || new Error("Failed to communicate with AI chat model");
      }
      res.json({ text });
    } catch (error: any) {
      console.error("Error in chat api:", error);
      let errMsg = error.message || "An error occurred with the AI service.";
      if (errMsg.includes('Your project has been denied access') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403')) {
        errMsg = "Google Gemini API Access Denied. The API key in Settings > Secrets may be invalid or suspended. Please contact support or update your API key.";
      } else if (errMsg.includes('quota') || errMsg.includes('429')) {
        errMsg = "Google Gemini API Quota Exceeded. Please try again later or check your API key quota.";
      } else {
        try { const parsed = JSON.parse(errMsg.replace('ApiError: ', '')); if (parsed.error?.message) errMsg = parsed.error.message; } catch(e) {}
      }
      res.status(500).json({ error: errMsg });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    const { input, educationText } = req.body;
    try {
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
        Full Name: ${input?.fullName || ''}
        Job Title: ${input?.jobTitle || ''}
        Experience Level: ${input?.experienceLevel || ''}
        GitHub: ${input?.github || ''}
        Portfolio/Website: ${input?.website || ''}
        Skills: ${input?.skills || ''}
        Work Experience Input: ${input?.experience || ''}
        Education Input: ${educationText || ''}
        Projects Input: ${input?.projects || ''}
      `;

      let text: string | undefined = undefined;
      let lastError: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = getGenAI();
          const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-pro-preview"];
          for (const modelName of modelsToTry) {
            try {
              const response = await genAI.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  responseSchema: resumeSchema,
                  temperature: 0.4,
                },
              });
              if (response.text) {
                text = response.text;
                break;
              }
            } catch (modelErr: any) {
              lastError = modelErr;
            }
          }
        } catch (aiErr: any) {
          lastError = aiErr;
        }
      }

      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ result: parsed });
      }

      // Fallback: If AI API call is denied or fails, use structured fallback parser
      console.warn("Gemini API call unsuccessful or denied access. Using structured fallback resume parser.", lastError?.message);
      const fallbackResult = buildFallbackResume(input, educationText);
      return res.json({ 
        result: fallbackResult,
        warning: "Generated using standard formatting due to Gemini API key limits." 
      });

    } catch (error: any) {
      console.error("Error generating resume:", error);
      const fallbackResult = buildFallbackResume(input, educationText);
      return res.json({ result: fallbackResult });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

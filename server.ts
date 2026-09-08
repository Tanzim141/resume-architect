import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

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
      const chat = genAI.chats.create({
        model: "gemini-3.5-flash",
        config: {
           systemInstruction: "You are a helpful AI assistant inside a Resume Builder application. Answer questions about resumes, career advice, and general topics, and communicate in whatever language the user speaks.",
           temperature: 0.7,
        },
        history: history || []
      });
      
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text || "I'm sorry, I couldn't generate a response." });
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
    try {
      const { input, educationText } = req.body;
      
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

      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: resumeSchema,
          temperature: 0.4,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const parsed = JSON.parse(text);
      res.json({ result: parsed });
    } catch (error: any) {
      console.error("Error generating resume:", error);
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

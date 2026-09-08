import { UserInput, GeneratedResume } from "../types";

export const chatWithAI = async (message: string, history: Array<{role: "user"|"model", parts: {text: string}[]}> = []): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    
    if (!response.ok) {
        const textResponse = await response.text().catch(() => "");
        let errStr = `HTTP ${response.status}: ${textResponse.substring(0, 50)}`;
        try { const errObj = JSON.parse(textResponse); if (errObj.error) errStr = errObj.error; } catch(e) {}
        throw new Error(errStr);
    }
    const data = await response.json();
    return data.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};

export const generateResumeContent = async (input: UserInput): Promise<GeneratedResume> => {
  const educationText = input.education
    .map(edu => {
      const yearStr = edu.endYear && edu.endYear !== edu.startYear 
        ? `${edu.startYear} - ${edu.endYear}` 
        : `${edu.startYear}`;
      const cgpaStr = edu.cgpa ? `, ${edu.scoreType || 'CGPA'}: ${edu.cgpa}` : '';
      return `Degree: ${edu.degree}, Institution: ${edu.school}, Year: ${yearStr}${cgpaStr}`;
    })
    .join('; ');

  try {
    const response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, educationText }),
    });

    if (!response.ok) {
        const textResponse = await response.text().catch(() => "");
        let errStr = `HTTP ${response.status}: ${textResponse.substring(0, 50)}`;
        try { const errObj = JSON.parse(textResponse); if (errObj.error) errStr = errObj.error; } catch(e) {}
        throw new Error(errStr);
    }
    
    const data = await response.json();
    return data.result as GeneratedResume;
  } catch (error) {
    console.error("Error generating resume:", error);
    throw error;
  }
};

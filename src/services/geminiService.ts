import { GoogleGenAI } from "@google/genai";
import { UserProfile, HospitalCard } from "../types";
import triageData from "../data/triage.json";
import specialtiesData from "../data/specialties.json";

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function sendChatMessage(
  message: string, 
  history: ChatMessage[], 
  userProfile?: UserProfile,
  availableHospitals: HospitalCard[] = []
) {
  try {
    const model = "gemini-3-flash-preview"; // Reverted to the user's working version
    
    const hospitalContext = availableHospitals.map(h => ({
      id: h.id,
      name: h.name,
      type: h.type,
      specializations: h.specializations
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...(history || []).map(h => ({
          role: h.role,
          parts: [{ text: h.parts[0].text }]
        })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are HoFi, a friendly and caring digital nurse at iCare+.
Your goal is to help people in Tagbilaran, Bohol find medical help.

RESPONSE STRUCTURE GUIDELINES:
1. START with a brief, empathetic acknowledgment.
2. PROVIDE clear "Next Steps" or care instructions.
3. RECOMMEND hospitals using a SPECIFIC TAG FORMAT for interactive chips: [HOSPITAL:ID:NAME]
4. IDENTIFY the needed specialty using the format: [SPECIALTY:NAME] (e.g., [SPECIALTY:Cardiologist])
5. KEEP it concise. Use bold text for emphasis.

CONTEXT:
Triage: ${JSON.stringify(triageData.triage_levels)}
Red Flags: ${JSON.stringify(triageData.red_flags)}
Hospitals: ${JSON.stringify(hospitalContext)}
User Profile: ${JSON.stringify(userProfile || {})}

IMPORTANT:
- NEVER mention "ESI Level", "Triage Code", or any internal medical classification numbers.
- Use the format [HOSPITAL:ID:NAME] for ALL hospital mentions.
- When suggesting multiple hospitals, list them one after another without using conjunctions like "or", "nor", or introductory phrases like "try this:".
- Use the format [SPECIALTY:NAME] if a specific doctor type is warranted.
- DO NOT use star icons (*), bullet points, or dashes for lists.
- For emphasis, use double asterisks like **This Text**. 
- Ensure every opening ** has a matching closing **.
- Keep the tone professional, empathetic, and clean.`,
      }
    });

    return { text: response.text };
  } catch (error: any) {
    console.error("AI SDK Error:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("API_KEY_MISSING");
    }
    throw error;
  }
}

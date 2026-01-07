import { GoogleGenAI } from "@google/genai";
import { SceneNode, Template } from "../types";
import { EQI_IDENTITY } from "../constants";
import { TemplateDomain } from "../domains/templates/TemplateService";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- EXISTING NODE MODIFICATION ---
export async function modifyDesignWithAI(currentDesign: SceneNode, userPrompt: string): Promise<SceneNode> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
    You are an expert design engine JSON modifier.
    You receive a JSON scene graph representing a UI design and a user instruction.
    You must return the MODIFIED JSON based on the instruction.
    
    CRITICAL RULES:
    1. Allowed Node Types: ONLY "FRAME", "TEXT", "IMAGE".
    2. Do NOT use "RECTANGLE", "ELLIPSE", "LINE", "VECTOR". Convert them to "FRAME" with styles.
    3. Do NOT change node IDs.
    4. Maintain tree structure unless asked to reorder.
    5. Valid LayoutModes: "HORIZONTAL", "VERTICAL".
    6. Valid Sizing: "FIXED", "FILL", "HUG".
    7. Colors: {r, g, b, a} (r,g,b 0-255, a 0-1).
    
    Return ONLY the raw JSON object. No markdown formatting.
  `;

  const prompt = `
    Current Design JSON:
    ${JSON.stringify(currentDesign)}

    User Instruction: "${userPrompt}"

    Return the updated JSON.
  `;

  return await callGeminiWithRetry(ai, systemPrompt, prompt);
}


// --- NEW TEMPLATE GENERATION ---
export async function generateTemplateWithAI(userPrompt: string): Promise<Template> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
  
    const ai = new GoogleGenAI({ apiKey });
    
    const identityContext = JSON.stringify(EQI_IDENTITY);

    const systemPrompt = `
      You are an expert design system architect.
      Create a new multi-page UI Template JSON based on the user's request.
      
      You must adhere to this Identity System (Colors, Fonts, Spacing):
      ${identityContext}

      OUTPUT FORMAT:
      Return a JSON object matching the 'Template' interface:
      {
        name: string,
        category: 'SOCIAL' | 'PRINT' | 'PRESENTATION' | 'WEBSITE',
        width: number,
        height: number,
        pages: [
            { name: string, node: SceneNode }
        ]
      }

      SCENE NODE RULES:
      - Use "FRAME", "TEXT", "IMAGE" types.
      - Use Auto Layout (layoutMode: HORIZONTAL/VERTICAL).
      - Use Identity colors strictly.
      - Root node of each page must match width/height.
    `;

    const prompt = `Create a design template for: "${userPrompt}"`;

    const result = await callGeminiWithRetry(ai, systemPrompt, prompt);
    
    // Construct full Template object
    const template: Template = {
        id: `tmpl_gen_${crypto.randomUUID()}`,
        type: 'USER',
        ownerId: 'user_01',
        identityId: EQI_IDENTITY.id,
        name: result.name || 'AI Generated Template',
        category: result.category || 'SOCIAL',
        width: result.width || 1080,
        height: result.height || 1080,
        pages: result.pages || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    // Immediately Persist
    TemplateDomain.saveTemplate(template);
    
    return template;
}


// --- HELPER ---
async function callGeminiWithRetry(ai: GoogleGenAI, system: string, prompt: string) {
    let lastError: any;
    const maxRetries = 3; 
    const baseDelay = 2000;
  
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: system,
            responseMimeType: 'application/json'
          }
        });
  
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return JSON.parse(text);
      } catch (e: any) {
        lastError = e;
        const msg = e.message?.toLowerCase() || '';
        const status = e.status || e.response?.status;
        
        const isTransientError = msg.includes('429') || status === 429 || status === 503;
  
        if (isTransientError && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await wait(delay);
          continue;
        }
        break;
      }
    }
    throw lastError;
}
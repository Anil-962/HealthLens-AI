
import { GoogleGenAI, Part, Modality, Chat } from "@google/genai";
import { MODEL_ANALYSIS, MODEL_CHAT, MODEL_TTS, SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION, MODEL_FAST, MODEL_TRANSCRIPTION, AUDIO_SCRIPT_INSTRUCTION, MODEL_IMAGE_GEN } from "../constants";
import { AnalysisData, UserRole, FocusArea, GroundingChunk, AnalysisMode } from "../types";

// Helper to convert File to base64 string
const fileToGenerativePart = async (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsDataURL(file);
  });
};

// --- ANALYSIS SERVICE ---
export const analyzeMedicalDocuments = async (
  files: File[], 
  userInstructions: string,
  userRole: UserRole,
  focusArea: FocusArea,
  mode: AnalysisMode
): Promise<AnalysisData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const filePromises = files.map(async (file) => {
      try {
        const part = await fileToGenerativePart(file);
        return { status: 'fulfilled' as const, value: part, fileName: file.name };
      } catch (e: any) {
        return { status: 'rejected' as const, reason: e.message || "Unknown error", fileName: file.name };
      }
    });

    const results = await Promise.all(filePromises);

    const successfulParts = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as { value: Part }).value);

    const failedFiles = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as { fileName: string, reason: string }));

    if (successfulParts.length === 0) {
      if (failedFiles.length > 0) {
          throw new Error(`Failed to process all files. ${failedFiles[0].fileName}: ${failedFiles[0].reason}`);
      }
      throw new Error("No valid files to analyze.");
    }

    let promptText = `Please analyze the attached medical documents.
    CONTEXT:
    User Role: ${userRole}
    Focus Area: ${focusArea}
    Analysis Mode: ${mode}
    `;
    
    if (userInstructions.trim()) {
      promptText += `\nUSER NOTES: ${userInstructions}`;
    }

    // Add specific instructions based on mode to tailor the content depth
    if (mode === 'quick') {
      promptText += `\n\nINSTRUCTION: Perform a 'Quick Scan'. Prioritize the Plain Summary and Key Findings. Keep the Clinician Explanation and Methods sections concise and direct. Focus on extracting the most critical facts immediately.`;
    } else {
      promptText += `\n\nINSTRUCTION: Perform a 'Deep Analysis'. Prioritize thoroughness. Provide detailed mechanistic explanations in the Clinician section. Evaluate risks and limitations critically. Ensure the Data Interpretation is comprehensive.`;
    }

    promptText += "\n\nReturn the strictly structured JSON as defined in system instructions. Do not include markdown formatting like ```json.";

    const promptPart: Part = { text: promptText };

    // Configure model based on mode
    const modelName = mode === 'quick' ? MODEL_FAST : MODEL_ANALYSIS;
    const thinkingConfig = mode === 'deep' ? { thinkingBudget: 8192 } : undefined;

    // --- GEMINI CALL ---
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [...successfulParts, promptPart],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // THINKING MODE ENABLED (only for deep mode)
        thinkingConfig, 
        // SEARCH GROUNDING ENABLED (for both, but essential for Pro)
        // Disable tools for Quick Mode to ensure strict JSON output
        tools: mode === 'deep' ? [{ googleSearch: {} }] : undefined,
        // responseMimeType: "application/json" is only supported when NOT using tools
        responseMimeType: mode === 'quick' ? "application/json" : undefined,
      },
    });

    if (response.text) {
      let cleanText = response.text.trim();
      
      // Robust JSON extraction: Find the first '{' and last '}'
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      } else if (cleanText.startsWith('```')) {
        // Fallback for markdown stripping if braces aren't found cleanly (rare)
        cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
      }
      
      try {
        const data: AnalysisData = JSON.parse(cleanText);
        
        if (failedFiles.length > 0) {
          data.processing_warnings = failedFiles.map(f => `Unable to include ${f.fileName} in analysis: ${f.reason}`);
        }

        // Extract Grounding Metadata
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[];
        if (groundingChunks) {
          data.grounding_urls = groundingChunks
            .filter(c => c.web?.uri && c.web?.title)
            .map(c => ({ title: c.web!.title, url: c.web!.uri }));
        }

        return data;
      } catch (e) {
        console.error("Failed to parse JSON:", e, "Raw text:", response.text);
        throw new Error("The analysis was generated but could not be formatted correctly. The model output was not valid JSON.");
      }
    } else {
      throw new Error("No analysis generated. The model returned an empty response.");
    }

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Enhanced error handling
    const msg = error.message?.toLowerCase() || "";
    const status = error.status || (error.response ? error.response.status : null);
    
    if (status === 400 || msg.includes("invalid argument")) {
        throw new Error("The request was rejected. This might be due to an unsupported file format or configuration error.");
    }
    if (status === 429 || msg.includes("quota") || msg.includes("rate limit")) {
      throw new Error("Rate limit exceeded. We are processing too many requests. Please wait a moment and try again.");
    }
    if (msg.includes('safety') || msg.includes('blocked')) {
       throw new Error("The content was flagged by safety settings and could not be analyzed. Please ensure uploaded files contain safe medical content.");
    }
    if (status === 503 || msg.includes("overloaded")) {
      throw new Error("The AI service is temporarily overloaded. Please try again shortly.");
    }
    if (msg.includes("fetch failed") || msg.includes("network")) {
        throw new Error("Network error. Please check your internet connection.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during analysis.");
  }
};

// --- AUDIO SCRIPT GENERATION SERVICE ---
export const generateSpokenScript = async (data: AnalysisData): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct the context from the analysis data
    const context = `
      PLAIN SUMMARY: ${data.plain_summary}
      KEY FINDINGS: ${data.key_findings.join('\n')}
      METHODS: ${data.methods}
      DATA INTERPRETATION: ${data.data_interpretation}
      RISKS: ${data.risks}
      LIMITATIONS: ${data.limitations}
      CLINICAL TAKEAWAY: ${data.clinical_takeaway}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ANALYSIS, // Using Pro for better writing
            contents: [{ parts: [{ text: context }] }],
            config: {
                systemInstruction: AUDIO_SCRIPT_INSTRUCTION,
            }
        });

        return response.text || "Here is a summary of your document.";
    } catch (error) {
        console.error("Script Generation Error", error);
        // Fallback to simple summary if script generation fails
        return `Here is a summary of your document. ${data.plain_summary}`;
    }
};

// --- IMAGE GENERATION SERVICE ---
export const generateVisualSummary = async (summary: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: {
        parts: [{ text: `Create a professional, educational medical illustration that visually explains this summary: ${summary}. Style: Clean, detailed, scientific diagram on a white background. No text labels.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw new Error("Failed to generate visual summary.");
  }
};

// --- TEXT TO SPEECH SERVICE ---
export const generateAudioSummary = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return `data:audio/wav;base64,${base64Audio}`;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// --- TRANSCRIPTION SERVICE ---
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        // Convert Blob to Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
        
        const base64Audio = await base64Promise;

        const response = await ai.models.generateContent({
            model: MODEL_TRANSCRIPTION,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "audio/webm", // Assuming MediaRecorder uses webm or default
                            data: base64Audio
                        }
                    },
                    { text: "Transcribe this clinical audio note accurately. Focus on correct spelling of medical terminology, medication names, and dosages. Do not add any conversational filler or introductory text. Return only the transcript." }
                ]
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Transcription Error:", error);
        throw new Error("Failed to transcribe audio.");
    }
};

// --- CHAT SERVICE ---
let chatSession: Chat | null = null;

export const initChatSession = async (context: string) => {
  if (!process.env.API_KEY) return;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction: CHAT_SYSTEM_INSTRUCTION + `\n\nDOCUMENT CONTEXT:\n${context}`
    }
  });
};

export const sendChatMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("Chat session not initialized");
  
  const result = await chatSession.sendMessage({ message });
  return result.text || "I couldn't generate a response.";
};

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Product } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Chatbot Feature (Gemini 3 Pro)
export const sendChatMessage = async (history: { role: string; text: string }[], newMessage: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "I'm sorry, I'm currently offline (API Key missing).";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { role: 'user', parts: [{ text: `System: You are a helpful, friendly shopping assistant for "ZapShop". You help users find products and answer questions about orders. Be concise.` }] },
        ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
        { role: 'user', parts: [{ text: newMessage }] }
      ],
    });
    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

// 2. Image Editing Feature (Gemini 2.5 Flash Image)
// This feature lets users say "Add a hat" and the model edits the product image.
export const editProductImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAI();
  if (!ai) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt } // e.g., "Make the background blue"
        ]
      }
    });

    // Check for image in response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};

// 3. Thinking Mode Feature (Gemini 3 Pro with Thinking Budget)
// Analyzes a product deeply to tell the user "Why they should buy this"
export const analyzeProductWithThinking = async (product: Product): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Cannot analyze without API Key.";

  const prompt = `
    Analyze this product deeply. Consider its features, price, and potential use cases.
    Tell me explicitly:
    1. Who is this for?
    2. Why is the price justified (or a steal)?
    3. What is the hidden benefit?
    
    Product: ${product.name}
    Price: $${product.price}
    Features: ${product.features.join(", ")}
    Description: ${product.description}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768, // Max budget for deep reasoning
        }
      }
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Thinking Analysis Error:", error);
    return "Sorry, I couldn't complete the deep analysis at this moment.";
  }
};

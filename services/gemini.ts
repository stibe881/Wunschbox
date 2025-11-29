
import { GoogleGenAI, Type } from "@google/genai";
import { AIGiftSuggestion } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateGiftIdeas = async (
  childName: string,
  age: string,
  interests: string,
  budget: string,
  gender: string
): Promise<AIGiftSuggestion[]> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key missing");
    return [];
  }

  const prompt = `
    Ich brauche Geschenkideen für ein Kind.
    Name: ${childName}
    Alter: ${age}
    Geschlecht: ${gender}
    Interessen: ${interests}
    Budget: ${budget}
    
    Bitte schlage 3-5 konkrete Geschenkideen vor.
    Gib die Antwort als JSON zurück.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedPriceRange: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as AIGiftSuggestion[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
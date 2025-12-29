
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";

// Always use process.env.API_KEY directly for initializing GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryInsights = async (products: Product[], sales: Sale[]) => {
  try {
    const prompt = `
      Analyze the current pet store inventory and sales data to provide business insights.
      
      Inventory Data:
      ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock, price: p.price, status: p.status })))}
      
      Recent Sales Data:
      ${JSON.stringify(sales.map(s => ({ total: s.total, items: s.items.length })))}

      Provide 3 short, actionable bullet points about what should be restocked, what is selling well, or pricing suggestions.
    `;

    // Removed maxOutputTokens to follow guidelines for Gemini 3 models when not strictly necessary
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    // response.text is a getter property, not a method
    return response.text || "No insights available at this moment.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Error fetching AI insights. Please check your connection.";
  }
};

export const getChatResponse = async (history: { role: 'user' | 'model', parts: string }[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      // Pass the existing history to maintain conversational context
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      })),
      config: {
        systemInstruction: 'You are an expert pet retail business consultant. Help the store owner manage their inventory, marketing, and customer service.',
      },
    });

    // chat.sendMessage only accepts the message parameter
    const response = await chat.sendMessage({ message });
    // response.text is a property
    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "The assistant is taking a nap. Try again later!";
  }
};

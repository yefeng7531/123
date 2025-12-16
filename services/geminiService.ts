import { GoogleGenAI, Type } from "@google/genai";
import { SoupLogic, SoupTone, SoupData, AISettings } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSoup = async (
  logic: SoupLogic,
  tone: SoupTone,
  customPrompt: string,
  settings: AISettings
): Promise<SoupData> => {
  
  const toneDesc = tone === SoupTone.Default ? "没有特定的恐怖或搞笑偏好，主要看重谜题质量" : `风格倾向于"${tone}"`;
  
  const prompt = `
    你是一个世界级的海龟汤（情境猜谜）游戏设计师。请你创作一个新的海龟汤谜题。
    
    【核心要求】
    1. 逻辑流派：${logic}。
       - 如果是本格：必须严格符合现实物理法则和逻辑，严禁鬼神、超能力。
       - 如果是变格：必须包含超自然、科幻或奇幻元素，需要通过脑洞来解谜。
    2. 汤底色调：${tone}。
       - ${toneDesc}。
    3. 题材/关键词：${customPrompt ? customPrompt : '随机选择一个有趣的题材'}。

    【谜题标准】
    1. 汤面（谜面）要引人入胜，包含强烈的矛盾点或令人费解的现象。
    2. 汤底（真相）要出人意料但又完全符合上述设定的逻辑。
    3. 难度适中（3-5星）。
    4. 请用简体中文回复。
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: {
        systemInstruction: "你是一个专业的悬疑小说家和解谜游戏设计师。你的任务是生成高质量的海龟汤谜题。",
        temperature: settings.temperature,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The title of the puzzle (short and catchy)",
            },
            surface: {
              type: Type.STRING,
              description: "The puzzle question/story (Soup Surface / 汤面)",
            },
            bottom: {
              type: Type.STRING,
              description: "The hidden truth/answer (Soup Bottom / 汤底)",
            },
            difficulty: {
              type: Type.INTEGER,
              description: "Difficulty level from 1 to 5",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Keywords describing the puzzle content",
            },
          },
          required: ["title", "surface", "bottom", "difficulty", "tags"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No text response received from Gemini.");
    }

    const data = JSON.parse(response.text);
    return data as SoupData;

  } catch (error) {
    console.error("Error generating soup:", error);
    throw error;
  }
};
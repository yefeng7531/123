import { GoogleGenAI, Type } from "@google/genai";
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings } from "../types";

/**
 * 测试 API 连接配置是否有效
 */
export const testConnection = async (settings: AISettings): Promise<boolean> => {
  const apiKey = settings.apiKey?.trim() || process.env.API_KEY;
  if (!apiKey) throw new Error("缺少 API Key");

  const clientConfig: any = { apiKey };
  if (settings.baseUrl?.trim()) {
    clientConfig.baseUrl = settings.baseUrl.trim();
  }

  const ai = new GoogleGenAI(clientConfig);

  try {
    // 尝试发送一个极简的请求来验证连通性
    await ai.models.generateContent({
      model: settings.model || 'gemini-2.5-flash',
      contents: "Ping",
      config: {
        maxOutputTokens: 1,
      }
    });
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    throw error;
  }
};

/**
 * 获取可用模型列表
 */
export const fetchModels = async (settings: AISettings): Promise<string[]> => {
  const apiKey = settings.apiKey?.trim() || process.env.API_KEY;
  if (!apiKey) throw new Error("缺少 API Key");

  const clientConfig: any = { apiKey };
  if (settings.baseUrl?.trim()) {
    clientConfig.baseUrl = settings.baseUrl.trim();
  }

  const ai = new GoogleGenAI(clientConfig);

  try {
    const response = await ai.models.list();
    // Assuming the response structure based on standard API
    // The SDK returns an object with a models property which is an array
    const models = (response as any).models || [];
    
    return models
      .map((m: any) => {
        const name = m.name || m.displayName || "";
        return name.replace(/^models\//, "");
      })
      .filter((name: string) => name.length > 0);
  } catch (error) {
    console.error("Failed to fetch models:", error);
    // Return empty array to allow UI to handle fallback
    return [];
  }
};

export const generateSoup = async (
  logic: SoupLogic,
  tone: SoupTone,
  difficulty: SoupDifficulty,
  customPrompt: string,
  settings: AISettings
): Promise<SoupData> => {
  
  // 确定 API Key：优先使用设置中的 Key，否则回退到环境变量
  const apiKey = settings.apiKey?.trim() || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("未配置 API Key。请在设置中输入您的 Google Gemini API Key。");
  }

  // 动态初始化 Client
  const clientConfig: any = { apiKey };
  if (settings.baseUrl?.trim()) {
    clientConfig.baseUrl = settings.baseUrl.trim();
  }
  
  const ai = new GoogleGenAI(clientConfig);
  
  const toneDesc = tone === SoupTone.Default ? "没有特定的恐怖或搞笑偏好，主要看重谜题质量" : `风格倾向于"${tone}"`;
  
  const prompt = `
    你是一个世界级的海龟汤（情境猜谜）游戏设计师。请你创作一个新的海龟汤谜题。
    
    【核心要求】
    1. 逻辑流派：${logic}。
       - 如果是本格：必须严格符合现实物理法则和逻辑，严禁鬼神、超能力。
       - 如果是变格：必须包含超自然、科幻或奇幻元素，需要通过脑洞来解谜。
    2. 汤底色调：${tone}。
       - ${toneDesc}。
    3. 难度目标：${difficulty}。
       - 简单：对应难度1-2星，逻辑比较直观，不需要过于复杂的转弯。
       - 普通：对应难度3星，有一定思维陷阱，需要仔细推敲。
       - 困难：对应难度4星，核心诡计难以看破，线索非常隐晦。
       - 烧脑：对应难度5星，极需侧向思维能力，真相往往颠覆常识。
    4. 题材/关键词：${customPrompt ? customPrompt : '随机选择一个有趣的题材'}。

    【谜题标准】
    1. 汤面（谜面）要引人入胜，包含强烈的矛盾点或令人费解的现象。
    2. 汤底（真相）要出人意料但又完全符合上述设定的逻辑。
    3. 难度评分请严格对应上述选择。
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
              description: "Difficulty level from 1 to 5, matching the requested difficulty goal",
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
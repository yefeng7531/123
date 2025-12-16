import { GoogleGenAI, Type } from "@google/genai";
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings } from "../types";

// --- Helpers ---

const getApiKey = (settings: AISettings): string => {
  // Logic: 
  // 1. Prefer user entered key
  // 2. Fallback to env key ONLY IF user input is empty/undefined.
  const userKey = settings.apiKey?.trim();
  const envKey = process.env.API_KEY;
  
  if (userKey) return userKey;
  if (envKey && envKey !== 'undefined' && envKey !== '') return envKey;
  
  throw new Error("请配置 API Key");
};

const getOpenAIBaseUrl = (settings: AISettings): string => {
  let url = settings.baseUrl?.trim();
  if (!url) return "https://api.openai.com/v1";
  // Remove trailing slash
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
};

// --- Connection Testing ---

export const testConnection = async (settings: AISettings): Promise<boolean> => {
  const apiKey = getApiKey(settings);
  
  if (settings.provider === 'openai') {
    // OpenAI Compatible Test
    const baseUrl = getOpenAIBaseUrl(settings);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 1
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return true;
    } catch (error: any) {
      console.error("OpenAI Connection failed:", error);
      throw error;
    }
  } else {
    // Google Gemini Test
    const clientConfig: any = { apiKey };
    if (settings.baseUrl?.trim()) {
      clientConfig.baseUrl = settings.baseUrl.trim();
    }
    const ai = new GoogleGenAI(clientConfig);

    try {
      await ai.models.generateContent({
        model: settings.model || 'gemini-2.5-flash',
        contents: "Ping",
        config: { maxOutputTokens: 1 }
      });
      return true;
    } catch (error) {
      console.error("Gemini Connection failed:", error);
      throw error;
    }
  }
};

// --- Fetch Models ---

export const fetchModels = async (settings: AISettings): Promise<string[]> => {
  const apiKey = getApiKey(settings);

  if (settings.provider === 'openai') {
    // OpenAI Models
    const baseUrl = getOpenAIBaseUrl(settings);
    // Usually standard OpenAI API has /v1/models. If user base url includes /v1, we might need to adjust.
    // However, users usually set BaseURL to ".../v1".
    // Let's try to assume BaseURL is correct root for chat/completions, so models should be at ../models?
    // Actually, simpler to assume standard structure: [BaseURL]/models if BaseURL ends in v1, or construct it carefully.
    
    // NOTE: Many proxy providers follow [BaseURL]/models
    const modelsUrl = baseUrl.endsWith('/v1') 
      ? `${baseUrl}/models` 
      : `${baseUrl.replace(/\/chat\/completions$/, '')}/models`; 
      // Safe bet: standard OpenAI uses /v1/models.
      // If user put `https://api.deepseek.com`, we might need `https://api.deepseek.com/models`.
      // Let's just try appending /models to the base (assuming base is .../v1).

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      if (Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch OpenAI models", e);
      return [];
    }
  } else {
    // Gemini Models
    const clientConfig: any = { apiKey };
    if (settings.baseUrl?.trim()) {
      clientConfig.baseUrl = settings.baseUrl.trim();
    }
    const ai = new GoogleGenAI(clientConfig);

    try {
      const response = await ai.models.list();
      const models = (response as any).models || [];
      return models
        .map((m: any) => {
          const name = m.name || m.displayName || "";
          return name.replace(/^models\//, "");
        })
        .filter((name: string) => name.length > 0);
    } catch (error) {
      console.error("Failed to fetch Gemini models:", error);
      return [];
    }
  }
};

// --- Generation ---

export const generateSoup = async (
  logic: SoupLogic,
  tone: SoupTone,
  difficulty: SoupDifficulty,
  customPrompt: string,
  settings: AISettings
): Promise<SoupData> => {
  
  const apiKey = getApiKey(settings);
  
  const toneDesc = tone === SoupTone.Default ? "没有特定的恐怖或搞笑偏好，主要看重谜题质量" : `风格倾向于"${tone}"`;
  
  const systemPrompt = "你是一个专业的悬疑小说家和解谜游戏设计师。你的任务是生成高质量的海龟汤谜题。请直接返回 JSON 格式数据，不要包含 Markdown 代码块标记。";

  const userPrompt = `
    请创作一个新的海龟汤谜题。
    
    【核心要求】
    1. 逻辑流派：${logic}。
    2. 汤底色调：${tone} (${toneDesc})。
    3. 难度目标：${difficulty} (1-5分)。
    4. 题材/关键词：${customPrompt || '随机有趣题材'}。

    请严格按照以下 JSON 格式返回：
    {
      "title": "标题",
      "surface": "汤面（谜题故事）",
      "bottom": "汤底（真相解析）",
      "difficulty": 3,
      "tags": ["标签1", "标签2"]
    }
  `;

  // --- OpenAI Provider Flow ---
  if (settings.provider === 'openai') {
    const baseUrl = getOpenAIBaseUrl(settings);
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: settings.temperature,
          // Try to enforce JSON mode if supported
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new Error("API returned empty response");

      // Clean cleanup potential markdown code blocks if the model ignored instructions
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(jsonStr) as SoupData;

    } catch (error) {
      console.error("OpenAI Generation Error:", error);
      throw error;
    }
  } 
  
  // --- Gemini Provider Flow ---
  else {
    const clientConfig: any = { apiKey };
    if (settings.baseUrl?.trim()) {
      clientConfig.baseUrl = settings.baseUrl.trim();
    }
    
    const ai = new GoogleGenAI(clientConfig);

    try {
      const response = await ai.models.generateContent({
        model: settings.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: settings.temperature,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              surface: { type: Type.STRING },
              bottom: { type: Type.STRING },
              difficulty: { type: Type.INTEGER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "surface", "bottom", "difficulty", "tags"],
          },
        },
      });

      if (!response.text) {
        throw new Error("No text response received from Gemini.");
      }

      return JSON.parse(response.text) as SoupData;

    } catch (error) {
      console.error("Gemini Generation Error:", error);
      throw error;
    }
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings } from "../types";

// --- Helpers ---

const getApiKey = (settings: AISettings): string => {
  const userKey = settings.apiKey?.trim();
  const envKey = process.env.API_KEY;
  
  if (userKey) return userKey;
  if (envKey && envKey !== 'undefined' && envKey !== '') return envKey;
  
  throw new Error("请配置 API Key");
};

/**
 * 清洗 Base URL
 * 1. 去除末尾斜杠
 * 2. 如果用户粘贴了完整的 /chat/completions 路径，自动去除，保留 Base 部分
 */
const cleanBaseUrl = (inputUrl: string | undefined): string => {
  let url = inputUrl?.trim();
  if (!url) return "https://api.openai.com/v1";
  
  // Remove trailing slashes
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Fix common mistake: User pastes full endpoint "https://.../v1/chat/completions"
  // We need the base "https://.../v1"
  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length);
  } else if (url.endsWith('/chat')) {
    url = url.slice(0, -'/chat'.length);
  }

  // Remove trailing slashes again just in case
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
};

// --- Connection Testing ---

export const testConnection = async (settings: AISettings): Promise<boolean> => {
  const apiKey = getApiKey(settings);
  
  if (settings.provider === 'openai') {
    let baseUrl = cleanBaseUrl(settings.baseUrl);
    
    const tryConnect = async (url: string): Promise<boolean> => {
      const response = await fetch(`${url}/chat/completions`, {
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
        // Create specific error object to catch status codes
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        try {
           const json = await response.json();
           if (json.error?.message) error.message = json.error.message;
        } catch (e) {}
        throw error;
      }
      return true;
    };

    try {
      return await tryConnect(baseUrl);
    } catch (error: any) {
      // Auto-fix: If 404 or 405 (Method Not Allowed), and URL doesn't end in /v1, 
      // the user likely forgot /v1. Try appending it.
      if ((error.status === 404 || error.status === 405) && !baseUrl.endsWith('/v1')) {
        console.log("Connection failed, trying auto-append /v1...");
        try {
           const newUrl = `${baseUrl}/v1`;
           await tryConnect(newUrl);
           // If successful, we should ideally inform the UI to update the setting, 
           // but strictly speaking we return true here indicating *connectivity* is possible.
           // To persist this fix, we throw a specific success-like error or just let the user know.
           // For now, we return true, but the next request might fail if we don't return the corrected URL.
           // Since we can't easily mutate settings here, we will rely on generateSoup applying the same logic 
           // OR we throw a descriptive error telling the user to add /v1.
           
           // Actually, throwing a helpful error is safer than silent magic that doesn't persist.
           throw new Error(`连接成功！但您的 Base URL 似乎缺少 "/v1"。\n请在设置中将 URL 修改为：\n${newUrl}`);
        } catch (retryError: any) {
           // If retry also failed, throw original or new error
           if (retryError.message && retryError.message.includes("请在设置中")) throw retryError;
        }
      }
      
      console.error("OpenAI/NewAPI Connection failed:", error);
      
      if (error.status === 405) {
        throw new Error("HTTP 405 Method Not Allowed: 请检查 Base URL 是否正确。通常 New API 需要以 /v1 结尾 (例如 https://api.site.com/v1)，且不能包含 /chat/completions。");
      }
      
      throw error;
    }
  } else {
    // Gemini Test
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
    const baseUrl = cleanBaseUrl(settings.baseUrl);
    // Standard OpenAI models endpoint
    const modelsUrl = `${baseUrl}/models`;

    try {
      const response = await fetch(modelsUrl, {
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
  
  const systemPrompt = "你是一个专业的悬疑小说家和解谜游戏设计师。你的任务是生成高质量的海龟汤谜题。请直接返回 JSON 格式数据，不要包含 Markdown 代码块标记（如 ```json）。确保返回的是合法的 JSON 字符串。";

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

  // --- OpenAI / New API Provider Flow ---
  if (settings.provider === 'openai') {
    const baseUrl = cleanBaseUrl(settings.baseUrl);
    
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
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new Error("API returned empty response");

      // Clean cleanup potential markdown code blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(jsonStr) as SoupData;

    } catch (error) {
      console.error("OpenAI/NewAPI Generation Error:", error);
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
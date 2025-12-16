import { GoogleGenAI, Type } from "@google/genai";
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings } from "../types";

// --- Helpers ---

const getApiKey = (settings: AISettings, allowEmpty: boolean = false): string => {
  const userKey = settings.apiKey?.trim();
  const envKey = process.env.API_KEY;
  
  if (userKey) return userKey;
  if (envKey && envKey !== 'undefined' && envKey !== '') return envKey;
  
  if (allowEmpty) return ""; // Allow empty for local proxies
  
  throw new Error("请配置 API Key / 密码");
};

const getOpenAIBaseUrl = (settings: AISettings): string => {
  let url = settings.baseUrl?.trim();
  if (!url) return "https://api.openai.com/v1";
  
  // Remove trailing slash for consistency
  if (url.endsWith('/')) url = url.slice(0, -1);
  
  return url;
};

const safeFetch = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      // Try to parse error json
      try {
        const json = JSON.parse(text);
        const msg = json.error?.message || json.message || `HTTP ${response.status}`;
        throw new Error(msg);
      } catch (e) {
        // If not json, might be html
        if (text.toLowerCase().includes('<!doctype') || text.toLowerCase().includes('<html')) {
          throw new Error(`Proxy Error (HTML returned): Check URL. HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
      }
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`);
    }
  } catch (error: any) {
    throw error;
  }
};

// --- Connection Testing ---

export const testConnection = async (settings: AISettings): Promise<{ success: boolean; correctedBaseUrl?: string }> => {
  // For OpenAI/Proxy, allow empty key
  const allowEmpty = settings.provider === 'openai';
  const apiKey = getApiKey(settings, allowEmpty);
  
  if (settings.provider === 'openai') {
    let baseUrl = getOpenAIBaseUrl(settings);

    const performTest = async (url: string) => {
      // Using chat/completions is the most reliable test for proxies
      // Some proxies don't implement /models
      return safeFetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 1,
          stream: false
        })
      });
    };

    try {
      // Attempt 1: As provided
      await performTest(baseUrl);
      return { success: true };
    } catch (error: any) {
      console.warn("Connection attempt 1 failed:", error.message);
      
      // Auto-correction logic for missing /v1
      if (!baseUrl.endsWith('/v1')) {
        const altUrl = `${baseUrl}/v1`;
        try {
          await performTest(altUrl);
          return { success: true, correctedBaseUrl: altUrl };
        } catch (e) {
          // ignore second failure
        }
      }
      throw error;
    }
  } else {
    // Gemini Test
    const apiKey = getApiKey(settings); // Gemini needs key
    const clientConfig: any = { apiKey };
    if (settings.baseUrl?.trim()) {
      clientConfig.baseUrl = settings.baseUrl.trim();
    }
    const ai = new GoogleGenAI(clientConfig);

    try {
      await ai.models.generateContent({
        model: settings.model || 'gemini-3-pro-preview',
        contents: "Ping",
        config: { maxOutputTokens: 1 }
      });
      return { success: true };
    } catch (error) {
      console.error("Gemini Connection failed:", error);
      throw error;
    }
  }
};

// --- Fetch Models ---

export const fetchModels = async (settings: AISettings): Promise<string[]> => {
  const allowEmpty = settings.provider === 'openai';
  const apiKey = getApiKey(settings, allowEmpty);

  if (settings.provider === 'openai') {
    const baseUrl = getOpenAIBaseUrl(settings);
    // Try standard endpoint. Many proxies support this.
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
      // Some proxies return { models: [...] } or just array
      if (Array.isArray(data)) return data.map((m: any) => m.id || m);
      
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
  
  const allowEmpty = settings.provider === 'openai';
  const apiKey = getApiKey(settings, allowEmpty);
  
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

  // --- OpenAI / New API / Proxy Flow ---
  if (settings.provider === 'openai') {
    const baseUrl = getOpenAIBaseUrl(settings);
    
    // SiliconFlow and DeepSeek models work best with stream:false for pure JSON tasks
    const body = {
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: settings.temperature,
      stream: false 
    };

    try {
      const data = await safeFetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      // Robust content extraction
      const choice = data.choices?.[0];
      let content = choice?.message?.content || choice?.text; // Support chat or legacy completion

      if (!content) {
        // Provide more detailed error info for debugging
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        if (choice?.finish_reason) throw new Error(`Generation stopped: ${choice.finish_reason} (Empty content)`);
        
        // Dump a snippet of raw response to help user identify format issues
        const rawSnippet = JSON.stringify(data).slice(0, 150);
        throw new Error(`API returned empty response. Raw: ${rawSnippet}...`);
      }

      // --- DeepSeek / Reasoning Model Cleanup ---
      // 1. Remove <think>...</think> blocks if present
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
      
      // 2. Remove markdown code blocks
      content = content.replace(/```json\n?|\n?```/g, "");

      // 3. Find the first '{' and last '}' to extract the JSON object, 
      //    ignoring any prologue or epilogue text often added by chat models.
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      return JSON.parse(content.trim()) as SoupData;

    } catch (error) {
      console.error("OpenAI/Proxy Generation Error:", error);
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
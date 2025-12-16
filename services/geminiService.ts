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
 * 基础 URL 清洗
 * 移除 /chat/completions, /models, 及多余斜杠
 */
const cleanBaseUrl = (inputUrl: string | undefined): string => {
  let url = inputUrl?.trim();
  if (!url) return "https://api.openai.com/v1";
  
  // Remove trailing slashes
  while (url.endsWith('/')) url = url.slice(0, -1);
  
  // Remove standard endpoints if user pasted full URL
  const suffixesToRemove = ['/chat/completions', '/chat', '/models', '/v1/models'];
  for (const suffix of suffixesToRemove) {
    if (url.endsWith(suffix)) {
      url = url.slice(0, -suffix.length);
    }
  }

  while (url.endsWith('/')) url = url.slice(0, -1);
  return url;
};

/**
 * 安全的 Fetch 请求封装
 * 处理 HTML 响应导致的 JSON 解析崩溃问题
 */
const safeFetch = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  
  // 如果响应不是 OK，尝试解析错误信息
  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    
    // 尝试解析 JSON 错误
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMsg = errorJson.error.message;
      } else if (errorJson.message) {
        errorMsg = errorJson.message;
      }
    } catch (e) {
      // 如果解析失败，说明返回的可能是 HTML (比如 Nginx 404/502 页面)
      // 截取前100个字符避免显示过长的 HTML
      const preview = errorText.slice(0, 100).replace(/\n/g, ' ');
      if (preview.toLowerCase().includes('<!doctype') || preview.toLowerCase().includes('<html')) {
        errorMsg += ` (服务器返回了 HTML 网页而非 JSON，请检查 Base URL 是否正确)`;
      } else {
        errorMsg += ` (${preview})`;
      }
    }
    throw new Error(errorMsg);
  }

  // 响应 OK，尝试解析 JSON
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // 状态码 200 但内容不是 JSON
    throw new Error(`API 返回了无效数据 (非 JSON): ${text.slice(0, 50)}...`);
  }
};

// --- Connection Testing ---

/**
 * 测试连接
 * 返回包含可能的 URL 修正建议
 */
export const testConnection = async (settings: AISettings): Promise<{ success: boolean; correctedBaseUrl?: string }> => {
  const apiKey = getApiKey(settings);
  
  if (settings.provider === 'openai') {
    let baseUrl = cleanBaseUrl(settings.baseUrl);

    // 定义一个测试函数
    const performTest = async (url: string) => {
      // 使用 chat/completions 也是一种测试，虽然 list models 更轻量，
      // 但某些 New API 转发站可能对 list models 支持不完善，chat 更核心。
      // 我们这里使用极简的 chat 请求。
      return safeFetch(`${url}/chat/completions`, {
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
    };

    try {
      // 第一次尝试：使用用户提供的（清洗后）URL
      await performTest(baseUrl);
      return { success: true };
    } catch (error: any) {
      console.warn("Attempt 1 failed:", error.message);
      
      // 智能修正逻辑：
      // 如果当前 URL 不包含 /v1，且发生了网络/协议错误，尝试追加 /v1 重试
      if (!baseUrl.endsWith('/v1')) {
        const altUrl = `${baseUrl}/v1`;
        console.log(`Auto-detect: Trying alternative URL: ${altUrl}`);
        try {
          await performTest(altUrl);
          // 如果这里成功了，说明 altUrl 才是正确的
          return { success: true, correctedBaseUrl: altUrl };
        } catch (retryError) {
           console.warn("Attempt 2 (with /v1) failed:", retryError);
        }
      }
      
      // 如果都失败了，抛出第一次的错误（或根据情况抛出更有意义的）
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
      return { success: true };
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
    // 假设 settings 中的 baseUrl 已经是经过 testConnection 验证或修正过的
    const modelsUrl = `${baseUrl}/models`;

    try {
      // 使用 fetch 直接调用，不使用 safeFetch 避免抛出错误中断流程，这里只 warn
      const response = await fetch(modelsUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        console.warn(`Fetch models failed: ${response.status}`);
        return [];
      }
      
      const data = await response.json(); // 如果这里抛错，会被 catch 捕获
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
      const data = await safeFetch(`${baseUrl}/chat/completions`, {
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

      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new Error("API returned empty response");

      // Clean cleanup potential markdown code blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      try {
        return JSON.parse(jsonStr) as SoupData;
      } catch (e) {
        console.error("Failed to parse LLM response:", content);
        throw new Error("模型返回的数据不是有效的 JSON 格式，请重试。");
      }

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
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings, PromptPayload } from "../types";

// --- Configuration & Defaults ---

export const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";

// --- Prompt Builder (Pure Function) ---

export const constructPromptPayload = (
  logic: SoupLogic,
  tone: SoupTone,
  difficulty: SoupDifficulty,
  customPrompt: string,
  settings: AISettings
): PromptPayload => {
  const toneDesc = tone === SoupTone.Default ? "没有特定的恐怖或搞笑偏好，主要看重谜题质量" : `风格倾向于"${tone}"`;
  
  const system = `你是一个专业的悬疑小说家和解谜游戏设计师。你的任务是生成高质量的海龟汤谜题。
请直接返回纯净的 JSON 格式数据，不要包含 Markdown 代码块标记（如 \`\`\`json）。
不要输出任何 <think> 标签或思考过程，只输出最终的 JSON 结果。
确保返回的是合法的 JSON 字符串。`;

  const user = `请创作一个新的海龟汤谜题。

【核心要求】
1. 逻辑流派：${logic}。
2. 汤底色调：${tone} (${toneDesc})。
3. 难度目标：${difficulty} (1-5分)。
4. 题材/关键词：${customPrompt || '随机有趣题材'}。

请严格按照以下 JSON 格式返回：
{
  "title": "标题",
  "surface": "汤面（谜题故事，引人入胜，包含关键线索但隐藏真相）",
  "bottom": "汤底（真相解析，逻辑自洽，令人恍然大悟）",
  "difficulty": 3,
  "tags": ["标签1", "标签2"]
}`;

  return {
    system,
    user,
    model: settings.model,
    temperature: settings.temperature
  };
};

// --- API Interaction ---

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

export const testConnection = async (settings: AISettings): Promise<{ success: boolean; correctedBaseUrl?: string }> => {
  const apiKey = settings.apiKey?.trim();
  const baseUrl = settings.baseUrl?.trim() || SILICONFLOW_BASE_URL;
  
  // Clean URL
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (!apiKey) throw new Error("请输入 API Key");

  try {
    // Light ping using models endpoint or a cheap chat completion
    await safeFetch(`${cleanUrl}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return { success: true };
  } catch (error: any) {
    console.warn("Connection attempt failed:", error.message);
    // Auto-correction logic for missing /v1
    if (!cleanUrl.endsWith('/v1')) {
      const altUrl = `${cleanUrl}/v1`;
      try {
         await safeFetch(`${altUrl}/models`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
         });
         return { success: true, correctedBaseUrl: altUrl };
      } catch (e) {
        // ignore
      }
    }
    throw error;
  }
};

export const fetchModels = async (settings: AISettings): Promise<string[]> => {
  const apiKey = settings.apiKey?.trim();
  const baseUrl = settings.baseUrl?.trim() || SILICONFLOW_BASE_URL;
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  try {
    const data = await safeFetch(`${cleanUrl}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (Array.isArray(data.data)) {
      return data.data.map((m: any) => m.id);
    }
    return [];
  } catch (e) {
    console.warn("Failed to fetch models", e);
    return [];
  }
};

export const generateSoup = async (
  logic: SoupLogic,
  tone: SoupTone,
  difficulty: SoupDifficulty,
  customPrompt: string,
  settings: AISettings,
  systemPromptOverride?: string,
  userPromptOverride?: string
): Promise<SoupData> => {
  
  const apiKey = settings.apiKey?.trim();
  const baseUrl = settings.baseUrl?.trim() || SILICONFLOW_BASE_URL;
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (!apiKey) throw new Error("请配置 API Key");

  // 1. Construct the payload (or use overrides)
  let payload = constructPromptPayload(logic, tone, difficulty, customPrompt, settings);
  
  if (systemPromptOverride !== undefined) payload.system = systemPromptOverride;
  if (userPromptOverride !== undefined) payload.user = userPromptOverride;

  // 2. Prepare API Request
  const body = {
    model: settings.model,
    messages: [
      { role: 'system', content: payload.system },
      { role: 'user', content: payload.user }
    ],
    temperature: settings.temperature,
    stream: false, // Critical for avoiding empty responses on some proxies
    max_tokens: 4096 // Ensure enough space for R1 thinking + JSON
  };

  try {
    const data = await safeFetch(`${cleanUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    // 3. Extract Content
    const choice = data.choices?.[0];
    let content = choice?.message?.content || choice?.text;

    if (!content) {
      if (data.error) throw new Error(data.error.message);
      throw new Error("API returned empty response.");
    }

    // 4. Cleanup DeepSeek specific artifacts
    // Remove <think> blocks common in DeepSeek-R1
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
    // Remove markdown code blocks
    content = content.replace(/```json\n?|\n?```/g, "");
    
    // Find JSON object wrapper
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    // 5. Parse
    const result = JSON.parse(content.trim()) as SoupData;
    
    // Attach prompt payload for history
    result.promptPayload = payload;
    
    return result;

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};
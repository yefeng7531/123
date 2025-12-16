export enum SoupLogic {
  Classic = '本格', // Realistic, logic-based
  Twisted = '变格', // Supernatural, sci-fi allowed
}

export enum SoupTone {
  Default = '原味', // Standard
  Red = '红汤',     // Horror, gore
  Black = '黑汤',   // Crime, dark psychology
  Clear = '清汤',   // Funny, slice of life
}

export enum SoupDifficulty {
  Easy = '简单',
  Normal = '普通',
  Hard = '困难',
  Hell = '烧脑',
}

export interface SoupData {
  id: string;        // Unique ID for history
  timestamp: number; // Created time
  title: string;
  surface: string; // The puzzle/question (汤面)
  bottom: string;  // The truth/answer (汤底)
  difficulty: number; // 1-5 stars
  tags: string[];
  logic?: SoupLogic; // Store context
  tone?: SoupTone;   // Store context
}

export interface AISettings {
  provider: 'gemini' | 'openai'; // New: Switch between Google SDK and OpenAI Compatible
  baseUrl?: string; // New: Custom endpoint
  apiKey?: string; // New: User override
  model: string;
  temperature: number;
}

export const LOGIC_CONFIGS: Record<SoupLogic, { description: string }> = {
  [SoupLogic.Classic]: { description: '现实逻辑，无超自然元素，依靠常识推理。' },
  [SoupLogic.Twisted]: { description: '脑洞大开，可包含科幻、奇幻、鬼怪设定。' },
};

export const TONE_CONFIGS: Record<SoupTone, { color: string; description: string; borderColor: string }> = {
  [SoupTone.Default]: { color: 'text-slate-400', borderColor: 'border-slate-500/50', description: '标准谜题，不限题材。' },
  [SoupTone.Red]: { color: 'text-red-500', borderColor: 'border-red-600/50', description: '惊悚恐怖，涉及死亡或血腥。' },
  [SoupTone.Black]: { color: 'text-gray-400', borderColor: 'border-gray-500/50', description: '人性阴暗，犯罪心理，细思极恐。' },
  [SoupTone.Clear]: { color: 'text-blue-400', borderColor: 'border-blue-500/50', description: '轻松幽默，温馨治愈，无恐怖成分。' },
};

export const DIFFICULTY_CONFIGS: Record<SoupDifficulty, { description: string, color: string, icon: string }> = {
  [SoupDifficulty.Easy]: { description: '直观易懂，适合新手', color: 'text-emerald-400', icon: '🌱' },
  [SoupDifficulty.Normal]: { description: '标准难度，逻辑适中', color: 'text-blue-400', icon: '💧' },
  [SoupDifficulty.Hard]: { description: '线索隐晦，误导性强', color: 'text-orange-400', icon: '🔥' },
  [SoupDifficulty.Hell]: { description: '极度烧脑，考验脑洞', color: 'text-red-500', icon: '👹' },
};

export const PRESET_TAGS = ["校园", "医院", "电梯", "古代", "科幻", "镜子", "车祸", "复仇", "误会", "超能力"];
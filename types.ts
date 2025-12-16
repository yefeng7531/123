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

export interface SoupData {
  title: string;
  surface: string; // The puzzle/question (汤面)
  bottom: string;  // The truth/answer (汤底)
  difficulty: number; // 1-5 stars
  tags: string[];
}

export interface AISettings {
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

export const PRESET_TAGS = ["校园", "医院", "电梯", "古代", "科幻", "镜子", "车祸", "复仇", "误会", "超能力"];

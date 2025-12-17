import { ReactNode } from 'react';

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

export interface PromptPayload {
  system: string;
  user: string;
  model: string;
  temperature: number;
}

export interface SoupData {
  id: string;        // Unique ID for history
  timestamp: number; // Created time
  title: string;
  surface: string; // The puzzle/question (汤面)
  bottom: string;  // The truth/answer (汤底)
  difficulty: number;
  tags: string[];
  logic?: SoupLogic;
  tone?: SoupTone;
  promptPayload?: PromptPayload; // Store the prompt used to generate this
}

export interface LogicConfig {
  color: string;
  icon: string;
  description: string;
}

export const LOGIC_CONFIGS: Record<SoupLogic, LogicConfig> = {
  [SoupLogic.Classic]: { color: 'text-emerald-400', icon: '🧬', description: '符合现实逻辑，无超自然因素' },
  [SoupLogic.Twisted]: { color: 'text-purple-400', icon: '👻', description: '包含科幻、鬼怪或超能力设定' },
};

export interface ToneConfig {
  color: string;
  borderColor: string;
}

export const TONE_CONFIGS: Record<SoupTone, ToneConfig> = {
  [SoupTone.Default]: { color: 'text-slate-300', borderColor: 'border-slate-600' },
  [SoupTone.Red]: { color: 'text-red-500', borderColor: 'border-red-800' },
  [SoupTone.Black]: { color: 'text-gray-400', borderColor: 'border-gray-700' },
  [SoupTone.Clear]: { color: 'text-blue-400', borderColor: 'border-blue-800' },
};

export interface DifficultyConfig {
  label: string;
  color: string;
  icon: string;
}

export const DIFFICULTY_CONFIGS: Record<SoupDifficulty, DifficultyConfig> = {
  [SoupDifficulty.Easy]: { label: 'Easy', color: 'text-emerald-400', icon: '🟢' },
  [SoupDifficulty.Normal]: { label: 'Normal', color: 'text-blue-400', icon: '🔵' },
  [SoupDifficulty.Hard]: { label: 'Hard', color: 'text-orange-400', icon: '🟠' },
  [SoupDifficulty.Hell]: { label: 'Hell', color: 'text-red-500', icon: '🔴' },
};

export const PRESET_TAGS = [
  "赛博朋克", "克苏鲁", "校园怪谈", "心理恐怖", "时间循环", 
  "密室", "复仇", "误会", "双重人格", "人工智能"
];

export interface AISettings {
  // Simplified for SiliconFlow/OpenAI compatible only
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

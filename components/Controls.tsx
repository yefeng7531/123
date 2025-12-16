import React, { useState } from 'react';
import { SoupLogic, SoupTone, SoupDifficulty, LOGIC_CONFIGS, TONE_CONFIGS, DIFFICULTY_CONFIGS, PRESET_TAGS, AISettings } from '../types';
import { Sparkles, Loader2, Settings, Dna, Palette, PenTool, BrainCircuit, BarChart3 } from 'lucide-react';

interface ControlsProps {
  logic: SoupLogic;
  setLogic: (l: SoupLogic) => void;
  tone: SoupTone;
  setTone: (t: SoupTone) => void;
  difficulty: SoupDifficulty;
  setDifficulty: (d: SoupDifficulty) => void;
  customPrompt: string;
  setCustomPrompt: (s: string) => void;
  aiSettings: AISettings;
  setAiSettings: (s: AISettings) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  logic,
  setLogic,
  tone,
  setTone,
  difficulty,
  setDifficulty,
  customPrompt,
  setCustomPrompt,
  aiSettings,
  setAiSettings,
  onGenerate,
  isLoading,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl w-full max-w-md">
      
      {/* Section 1: Logic (Base) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold font-serif">
          <Dna className="w-4 h-4 text-emerald-500" />
          <span>基础规则</span>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-1 rounded-xl border border-slate-800">
          {(Object.values(SoupLogic) as SoupLogic[]).map((l) => (
            <button
              key={l}
              onClick={() => setLogic(l)}
              className={`
                py-2 px-4 rounded-lg text-sm font-bold transition-all
                ${logic === l 
                  ? 'bg-slate-700 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 px-1">{LOGIC_CONFIGS[logic].description}</p>
      </div>

      {/* Section 2: Tone (Flavor) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold font-serif">
          <Palette className="w-4 h-4 text-purple-500" />
          <span>汤底口味</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.values(SoupTone) as SoupTone[]).map((t) => {
            const isSelected = tone === t;
            const config = TONE_CONFIGS[t];
            return (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`
                  relative flex items-center justify-center p-2.5 rounded-lg border transition-all text-sm font-medium
                  ${isSelected 
                    ? `${config.borderColor} bg-slate-800 ${config.color} ring-1 ring-offset-1 ring-offset-slate-900 ring-slate-600`
                    : 'border-slate-800 bg-slate-800/20 text-slate-400 hover:bg-slate-800/60'
                  }
                `}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section 3: Difficulty */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold font-serif">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span>难度等级</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.values(SoupDifficulty) as SoupDifficulty[]).map((d) => {
            const isSelected = difficulty === d;
            const config = DIFFICULTY_CONFIGS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all
                  ${isSelected 
                    ? `bg-slate-800 border-slate-600 ${config.color} shadow-sm` 
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:bg-slate-800/60'
                  }
                `}
                title={config.description}
              >
                <span className="text-lg mb-0.5">{config.icon}</span>
                <span className="text-xs font-bold scale-90">{d}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 px-1 text-center h-4">{DIFFICULTY_CONFIGS[difficulty].description}</p>
      </div>

      {/* Section 4: Custom Prompt */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold font-serif">
          <PenTool className="w-4 h-4 text-amber-500" />
          <span>题材/关键词 (可选)</span>
        </div>
        <input 
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="例如：恐怖游轮、午夜办公室..."
          className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setCustomPrompt(tag)}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Divider with Settings Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showSettings ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          AI 设置
        </button>
      </div>

      {/* AI Settings Panel */}
      {showSettings && (
        <div className="bg-slate-950/30 rounded-xl p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
             <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">模型选择</label>
             <div className="grid grid-cols-1 gap-1">
                <button 
                  onClick={() => setAiSettings({...aiSettings, model: 'gemini-2.5-flash'})}
                  className={`text-left px-3 py-2 rounded border text-xs flex items-center justify-between ${aiSettings.model === 'gemini-2.5-flash' ? 'bg-amber-900/20 border-amber-800 text-amber-100' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">Gemini 2.5 Flash</span>
                  <span className="text-[10px] opacity-70">快速</span>
                </button>
                <button 
                  onClick={() => setAiSettings({...aiSettings, model: 'gemini-3-pro-preview'})}
                  className={`text-left px-3 py-2 rounded border text-xs flex items-center justify-between ${aiSettings.model === 'gemini-3-pro-preview' ? 'bg-amber-900/20 border-amber-800 text-amber-100' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">Gemini 3.0 Pro</span>
                  <span className="text-[10px] opacity-70">聪明</span>
                </button>
             </div>
          </div>
          <div className="space-y-1">
             <div className="flex justify-between">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">创意度 (Temperature): {aiSettings.temperature}</label>
             </div>
             <input 
               type="range" 
               min="0.5" 
               max="1.5" 
               step="0.1"
               value={aiSettings.temperature}
               onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
               className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
             />
             <div className="flex justify-between text-[10px] text-slate-600">
                <span>严谨</span>
                <span>疯狂</span>
             </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className={`
          group relative flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-lg transition-all duration-300 mt-2
          ${isLoading 
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>正在熬制...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            <span>开始熬汤</span>
          </>
        )}
      </button>
    </div>
  );
};
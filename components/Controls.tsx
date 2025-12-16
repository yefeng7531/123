import React, { useState } from 'react';
import { SoupLogic, SoupTone, SoupDifficulty, LOGIC_CONFIGS, TONE_CONFIGS, DIFFICULTY_CONFIGS, PRESET_TAGS, AISettings } from '../types';
import { testConnection, fetchModels } from '../services/geminiService';
import { Sparkles, Loader2, Settings, Dna, Palette, PenTool, BarChart3, Key, Link, Plug, CheckCircle2, XCircle, Server, RefreshCw, Cpu, Globe } from 'lucide-react';

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

const DEFAULT_GEMINI_MODELS = [
  "gemini-3-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
];

const DEFAULT_OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "deepseek-ai/DeepSeek-V3", 
  "deepseek-ai/DeepSeek-R1",
  "deepseek-chat",
  "deepseek-reasoner",
  "claude-3-5-sonnet",
];

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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const currentModelList = availableModels.length > 0 ? availableModels : (aiSettings.provider === 'openai' ? DEFAULT_OPENAI_MODELS : DEFAULT_GEMINI_MODELS);

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMsg('Connecting...');
    setAvailableModels([]); 

    try {
      const result = await testConnection(aiSettings);
      
      let newSettings = { ...aiSettings };
      if (result.correctedBaseUrl) {
        newSettings.baseUrl = result.correctedBaseUrl;
        setAiSettings(newSettings);
      }

      setConnectionMsg('Fetching Models...');
      const models = await fetchModels(newSettings);
      
      if (models.length > 0) {
        setAvailableModels(models);
        setConnectionMsg(`Connected! (${models.length} models)`);
      } else {
        setConnectionMsg('Connected! (Default models)');
      }

      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } catch (error: any) {
      setConnectionStatus('error');
      const msg = error.message || 'Connection Failed';
      setConnectionMsg(msg.length > 25 ? msg.slice(0, 25) + '...' : msg);
      console.error("Conn Error:", error);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl w-full max-w-md transition-all">
      
      {/* --- Main Gameplay Controls --- */}
      
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
              className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${logic === l ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

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
                className={`relative flex items-center justify-center p-2.5 rounded-lg border transition-all text-sm font-medium ${isSelected ? `${config.borderColor} bg-slate-800 ${config.color} ring-1 ring-slate-600` : 'border-slate-800 bg-slate-800/20 text-slate-400 hover:bg-slate-800/60'}`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

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
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${isSelected ? `bg-slate-800 border-slate-600 ${config.color} shadow-sm` : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:bg-slate-800/60'}`}
              >
                <span className="text-lg mb-0.5">{config.icon}</span>
                <span className="text-xs font-bold scale-90">{d}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold font-serif">
          <PenTool className="w-4 h-4 text-amber-500" />
          <span>题材/关键词</span>
        </div>
        <input 
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="例如：恐怖游轮..."
          className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setCustomPrompt(tag)}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* --- Settings Toggle --- */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${showSettings ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Settings className="w-4 h-4" />
          API Connections
        </button>
      </div>

      {/* --- SillyTavern Style API Panel --- */}
      {showSettings && (
        <div className="bg-[#0b101b] rounded-xl p-4 space-y-4 border border-slate-700 shadow-inner animate-in fade-in zoom-in-95 duration-200">
          
          {/* API Type Select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">API Type</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded border border-slate-800">
              <button
                onClick={() => setAiSettings({...aiSettings, provider: 'gemini', model: 'gemini-3-pro-preview'})}
                className={`flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${aiSettings.provider === 'gemini' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Sparkles className="w-3 h-3" /> Gemini
              </button>
              <button
                onClick={() => setAiSettings({...aiSettings, provider: 'openai', model: 'deepseek-ai/DeepSeek-V3'})}
                className={`flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${aiSettings.provider === 'openai' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Cpu className="w-3 h-3" /> OpenAI / DeepSeek
              </button>
            </div>
          </div>

          {/* API URL */}
          <div className="space-y-1">
             <label className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> API URL (Base URL)</span>
             </label>
             <input 
               type="text"
               value={aiSettings.baseUrl || ''}
               onChange={(e) => setAiSettings({...aiSettings, baseUrl: e.target.value})}
               placeholder={aiSettings.provider === 'openai' ? "https://api.siliconflow.cn/v1" : "Optional (Default: Google API)"}
               className="w-full bg-[#161f33] border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
             />
             {aiSettings.provider === 'openai' && (
               <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setAiSettings({...aiSettings, baseUrl: 'https://api.siliconflow.cn/v1'})}
                    className="text-[9px] text-slate-500 hover:text-amber-500 underline"
                  >
                    Set SiliconFlow
                  </button>
                  <button 
                    onClick={() => setAiSettings({...aiSettings, baseUrl: 'http://127.0.0.1:8000/v1'})}
                    className="text-[9px] text-slate-500 hover:text-amber-500 underline"
                  >
                    Set Local
                  </button>
               </div>
             )}
          </div>

          {/* API Key / Password */}
          <div className="space-y-1">
             <label className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                <Key className="w-3 h-3"/> {aiSettings.provider === 'openai' ? "API Key / Password" : "API Key"}
             </label>
             <input 
               type="password"
               value={aiSettings.apiKey || ''}
               onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
               placeholder={aiSettings.provider === 'openai' ? "sk-... or Proxy Password" : "Gemini API Key"}
               className="w-full bg-[#161f33] border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
             />
          </div>

          {/* Connect Button */}
          <button 
            onClick={handleTestConnection}
            disabled={connectionStatus === 'testing'}
            className={`
              w-full py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
              ${connectionStatus === 'success' 
                ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400' 
                : connectionStatus === 'error'
                  ? 'bg-red-900/30 border-red-600 text-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
              }
            `}
          >
            {connectionStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
            {connectionStatus === 'testing' ? 'Connecting...' : connectionStatus === 'success' ? 'Connected' : 'Connect'}
          </button>
          
          {connectionMsg && (
             <div className="text-[10px] text-center text-slate-500 font-mono">{connectionMsg}</div>
          )}

          <div className="h-px bg-slate-800 w-full my-2" />

          {/* Model Selection */}
          <div className="space-y-1">
             <label className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span className="flex items-center gap-1"><Server className="w-3 h-3"/> Model ID</span>
                <span className="text-[9px] opacity-50">{currentModelList.length} Available</span>
             </label>
             <div className="relative group">
                <input 
                  list="model-list"
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                  className="w-full bg-[#161f33] border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="Select or type model ID"
                />
                <datalist id="model-list">
                  {currentModelList.map(m => <option key={m} value={m} />)}
                </datalist>
             </div>
          </div>
          
          {/* Temperature */}
          <div className="space-y-2 pt-1">
             <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Temperature</span>
                <span>{aiSettings.temperature}</span>
             </div>
             <input 
               type="range" min="0.1" max="2.0" step="0.05"
               value={aiSettings.temperature}
               onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
               className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
             />
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
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:animate-pulse" />}
        <span>{isLoading ? 'Processing...' : 'Generate Soup'}</span>
      </button>
    </div>
  );
};
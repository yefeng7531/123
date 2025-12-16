import React, { useState } from 'react';
import { SoupLogic, SoupTone, SoupDifficulty, LOGIC_CONFIGS, TONE_CONFIGS, DIFFICULTY_CONFIGS, PRESET_TAGS, AISettings } from '../types';
import { testConnection, fetchModels } from '../services/geminiService';
import { Sparkles, Loader2, Settings, Dna, Palette, PenTool, BarChart3, Key, Link, Plug, CheckCircle2, XCircle, Server, RefreshCw, Cpu } from 'lucide-react';

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
  "gemini-2.5-flash",
  "gemini-3-pro-preview",
  "gemini-2.0-flash-exp",
];

const DEFAULT_OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
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
  
  // Dynamic list based on fetch
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Derived defaults based on provider
  const defaultModels = aiSettings.provider === 'openai' ? DEFAULT_OPENAI_MODELS : DEFAULT_GEMINI_MODELS;
  const currentModelList = availableModels.length > 0 ? availableModels : defaultModels;

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMsg('正在连接...');
    setAvailableModels([]); // Reset list on new test

    try {
      // 1. Test basic connectivity (Ping)
      await testConnection(aiSettings);
      
      // 2. Fetch available models
      setConnectionMsg('获取模型列表...');
      const models = await fetchModels(aiSettings);
      
      if (models.length > 0) {
        setAvailableModels(models);
      }

      setConnectionStatus('success');
      setConnectionMsg(`已连接 (发现 ${models.length > 0 ? models.length : '默认'} 个模型)`);
      
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMsg(error.message || '连接失败');
    }
  };

  const toggleProvider = () => {
    const newProvider = aiSettings.provider === 'gemini' ? 'openai' : 'gemini';
    const newModel = newProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini';
    const newBaseUrl = ''; // Reset base URL when switching to avoid confusion
    
    setAiSettings({
      ...aiSettings, 
      provider: newProvider,
      model: newModel,
      baseUrl: newBaseUrl
    });
    setAvailableModels([]); // Reset fetched models
    setConnectionStatus('idle');
    setConnectionMsg('');
  };

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
          API 连接 (API Connections)
        </button>
      </div>

      {/* AI Settings Panel - SillyTavern Style */}
      {showSettings && (
        <div className="bg-slate-950/40 rounded-xl p-3 space-y-4 animate-in fade-in slide-in-from-top-2 border border-slate-800">
          
          {/* Provider Selection */}
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => aiSettings.provider !== 'gemini' && toggleProvider()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition-all ${aiSettings.provider === 'gemini' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Google Gemini
            </button>
            <button
              onClick={() => aiSettings.provider !== 'openai' && toggleProvider()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition-all ${aiSettings.provider === 'openai' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              OpenAI / New API
            </button>
          </div>

          <div className="space-y-3">
             {/* API Key Input */}
             <div className="space-y-1">
               <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                 <Key className="w-3 h-3" /> API Key
               </label>
               <input 
                 type="password"
                 value={aiSettings.apiKey || ''}
                 onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
                 placeholder="粘贴你的 API Key (sk-...)"
                 className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none font-mono"
               />
             </div>
             
             {/* Base URL Input */}
             <div className="space-y-1">
               <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                 <Link className="w-3 h-3" /> API Endpoint (Base URL)
               </label>
               <input 
                 type="text"
                 value={aiSettings.baseUrl || ''}
                 onChange={(e) => setAiSettings({...aiSettings, baseUrl: e.target.value})}
                 placeholder={aiSettings.provider === 'openai' ? "New API 请填: https://your-domain/v1" : "默认: Google官方, 可填 Gemini 反代"}
                 className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none font-mono"
               />
               {aiSettings.provider === 'openai' && (
                 <p className="text-[9px] text-slate-500 pl-1">
                   提示：New API/OneAPI 通常需要以 <code>/v1</code> 结尾
                 </p>
               )}
             </div>

             {/* Connection Status & Button */}
             <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <button 
                    onClick={handleTestConnection}
                    disabled={connectionStatus === 'testing'}
                    className={`
                      flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border w-24 shrink-0
                      ${connectionStatus === 'testing' 
                        ? 'bg-slate-800 border-slate-700 text-slate-500' 
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                      }
                    `}
                  >
                    {connectionStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                    {connectionStatus === 'testing' ? 'Connecting' : 'Connect'}
                  </button>
                  
                  {connectionMsg && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold overflow-hidden whitespace-nowrap text-ellipsis ${connectionStatus === 'success' ? 'text-emerald-500' : connectionStatus === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
                       {connectionStatus === 'success' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                       {connectionStatus === 'error' && <XCircle className="w-3 h-3 shrink-0" />}
                       <span>{connectionMsg}</span>
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          {/* Model Selection (Text Input + Datalist) */}
          <div className="space-y-1">
             <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                   <Server className="w-3 h-3" /> 模型选择 (Model ID)
                </label>
                <span className="text-[10px] text-slate-600">
                  {availableModels.length > 0 ? `已加载 ${availableModels.length} 个模型` : '使用预设列表'}
                </span>
             </div>
             
             <div className="relative group">
                <input 
                  list="model-options"
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none font-mono"
                  placeholder="输入或选择模型 ID"
                />
                <div className="absolute right-2 top-1.5 pointer-events-none opacity-50">
                  <RefreshCw className={`w-3 h-3 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                </div>
                <datalist id="model-options">
                  {currentModelList.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
             </div>
             <p className="text-[10px] text-slate-600 pt-0.5">
               {aiSettings.provider === 'gemini' 
                 ? "支持 gemini-2.5-flash, gemini-3-pro 等" 
                 : "支持 gpt-4o, deepseek-chat, claude-3-5 等"
               }
             </p>
          </div>

          {/* Temperature */}
          <div className="space-y-1 pt-1">
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
                <span>严谨 (0.5)</span>
                <span>疯狂 (1.5)</span>
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
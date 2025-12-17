import React, { useState } from 'react';
import { SoupLogic, SoupTone, SoupDifficulty, TONE_CONFIGS, DIFFICULTY_CONFIGS, PRESET_TAGS, AISettings } from '../types';
import { testConnection, fetchModels, constructPromptPayload, SILICONFLOW_BASE_URL } from '../services/geminiService';
import { Sparkles, Loader2, Settings, Dna, Palette, PenTool, BarChart3, Key, Plug, Server, Code, X, RefreshCw, Send, Lock, Unlock } from 'lucide-react';

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
  onGenerate: (sys?: string, user?: string) => void;
  isLoading: boolean;
}

const SILICONFLOW_MODELS = [
  "deepseek-ai/DeepSeek-V3", 
  "deepseek-ai/DeepSeek-R1",
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
  "01-ai/Yi-1.5-34B-Chat-16K",
  "THUDM/glm-4-9b-chat"
];

// Encrypted-ish or just constant site key as requested
const SITE_KEY = "sk-sanuznnwkqxjtfhugszzynjsbuaiqfjcznzvzqwhcbgnyhgg";
const SECURITY_QUESTION = "网站所有人";
const SECURITY_ANSWER = "yefeng";

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
  const [showSettings, setShowSettings] = useState(true); // Default open for first time users
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const currentModelList = availableModels.length > 0 ? availableModels : SILICONFLOW_MODELS;

  // State for editable prompts
  const [editableSystemPrompt, setEditableSystemPrompt] = useState('');
  const [editableUserPrompt, setEditableUserPrompt] = useState('');

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  // Open modal and populate fields
  const handleOpenPromptModal = () => {
    const payload = constructPromptPayload(logic, tone, difficulty, customPrompt, aiSettings);
    setEditableSystemPrompt(payload.system);
    setEditableUserPrompt(payload.user);
    setShowPromptModal(true);
  };

  const handleResetPrompt = () => {
    const payload = constructPromptPayload(logic, tone, difficulty, customPrompt, aiSettings);
    setEditableSystemPrompt(payload.system);
    setEditableUserPrompt(payload.user);
  };

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
        setConnectionMsg(`Success! (${models.length} models)`);
      } else {
        setConnectionMsg('Success! (Default models)');
      }

      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } catch (error: any) {
      setConnectionStatus('error');
      const msg = error.message || 'Connection Failed';
      setConnectionMsg(msg.length > 25 ? msg.slice(0, 25) + '...' : msg);
    }
  };

  const handleUnlockKey = () => {
    if (unlockInput.trim().toLowerCase() === SECURITY_ANSWER.toLowerCase()) {
      setAiSettings({ ...aiSettings, apiKey: SITE_KEY });
      setShowUnlockModal(false);
      setUnlockInput('');
      setUnlockError(false);
      // alert("内置 Key 已填充！");
    } else {
      setUnlockError(true);
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
          SiliconFlow API
        </button>
        
        {/* Connection Indicator */}
        {!showSettings && (
           <div className={`w-2 h-2 rounded-full ${aiSettings.apiKey ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
        )}
      </div>

      {/* --- Detailed Settings Panel --- */}
      {showSettings && (
        <div className="bg-[#0b101b] rounded-xl p-4 space-y-4 border border-slate-700 shadow-inner animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header & Link */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Configuration</span>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUnlockModal(true)}
                className="text-[10px] text-emerald-500 hover:text-emerald-400 underline flex items-center gap-1"
              >
                解锁内置 Key <Lock className="w-3 h-3" />
              </button>
              <a 
                href="https://cloud.siliconflow.cn/account/ak" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-amber-500 hover:text-amber-400 underline flex items-center gap-1"
              >
                获取 Key <Plug className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-1">
             <label className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                <Key className="w-3 h-3"/> SiliconFlow Key (sk-...)
             </label>
             <input 
               type="password"
               value={aiSettings.apiKey || ''}
               onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
               placeholder="sk-xxxxxxxxxxxxxxxx"
               className="w-full bg-[#161f33] border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
             />
          </div>

          {/* Base URL */}
          <div className="space-y-1">
             <label className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span className="flex items-center gap-1"><Server className="w-3 h-3"/> Base URL</span>
             </label>
             <input 
               type="text"
               value={aiSettings.baseUrl || ''}
               onChange={(e) => setAiSettings({...aiSettings, baseUrl: e.target.value})}
               placeholder={SILICONFLOW_BASE_URL}
               className="w-full bg-[#161f33] border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
             />
          </div>

          <div className="h-px bg-slate-800 w-full my-2" />

          {/* Model Selection */}
          <div className="space-y-1">
             <label className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span className="flex items-center gap-1"><Server className="w-3 h-3"/> Model ID</span>
                {availableModels.length > 0 && <span className="text-[9px] text-emerald-500">{availableModels.length} Loaded</span>}
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
                <span>Temperature (Creativity)</span>
                <span>{aiSettings.temperature}</span>
             </div>
             <input 
               type="range" min="0.1" max="2.0" step="0.1"
               value={aiSettings.temperature}
               onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
               className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
             />
          </div>

          {/* Test Connection */}
          <button 
            onClick={handleTestConnection}
            disabled={connectionStatus === 'testing' || !aiSettings.apiKey}
            className={`
              w-full py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
              ${connectionStatus === 'success' 
                ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400' 
                : connectionStatus === 'error'
                  ? 'bg-red-900/30 border-red-600 text-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {connectionStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
            {connectionStatus === 'testing' ? 'Connecting...' : connectionStatus === 'success' ? 'Models Loaded' : 'Test Connection'}
          </button>
          
          {connectionMsg && (
             <div className={`text-[10px] text-center font-mono ${connectionStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{connectionMsg}</div>
          )}

        </div>
      )}

      {/* Generate Actions */}
      <div className="flex gap-2 mt-2">
        {/* Prompt Inspector Button */}
        <button
          onClick={handleOpenPromptModal}
          className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all active:scale-95"
          title="编辑提示词 (Edit Prompt)"
        >
          <Code className="w-5 h-5" />
        </button>

        {/* Main Generate Button */}
        <button
          onClick={() => onGenerate()}
          disabled={isLoading || !aiSettings.apiKey}
          className={`
            flex-1 group relative flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-lg transition-all duration-300
            ${isLoading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : !aiSettings.apiKey
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]'
            }
          `}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:animate-pulse" />}
          <span>{isLoading ? 'Processing...' : 'Generate Soup'}</span>
        </button>
      </div>

      {/* Prompt Inspector / Editor Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Code className="w-4 h-4 text-amber-500" />
                <span>Prompt Editor</span>
              </div>
              <button 
                onClick={() => setShowPromptModal(false)}
                className="text-slate-500 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0b101b]">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>System Prompt</span>
                    <span className="text-[10px] text-slate-600">Global instructions</span>
                 </label>
                 <textarea
                   value={editableSystemPrompt}
                   onChange={(e) => setEditableSystemPrompt(e.target.value)}
                   className="w-full h-32 bg-[#0f1219] p-3 rounded-lg border border-slate-700 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 focus:outline-none resize-y"
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>User Prompt</span>
                    <span className="text-[10px] text-slate-600">The specific request</span>
                 </label>
                 <textarea
                   value={editableUserPrompt}
                   onChange={(e) => setEditableUserPrompt(e.target.value)}
                   className="w-full h-40 bg-[#0f1219] p-3 rounded-lg border border-slate-700 text-xs font-mono text-blue-300 focus:border-blue-500/50 focus:outline-none resize-y"
                 />
               </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between gap-3">
                <button
                    onClick={handleResetPrompt}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset to Default
                </button>
                
                <button
                    onClick={() => {
                        onGenerate(editableSystemPrompt, editableUserPrompt);
                        setShowPromptModal(false);
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-3.5 h-3.5" /> 
                    {isLoading ? 'Processing...' : 'Run with this Prompt'}
                </button>
            </div>

          </div>
        </div>
      )}

      {/* Unlock Key Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-6 text-center space-y-4">
               <div className="w-12 h-12 bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Unlock className="w-6 h-6" />
               </div>
               
               <div className="space-y-1">
                 <h3 className="text-lg font-bold text-white">解锁内置 API Key</h3>
                 <p className="text-sm text-slate-400">回答安全问题以自动填充 Key</p>
               </div>

               <div className="text-left space-y-2 py-2">
                 <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">问题</label>
                 <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 text-sm">
                   {SECURITY_QUESTION}
                 </div>
               </div>

               <div className="text-left space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>答案</span>
                    {unlockError && <span className="text-red-500 normal-case">答案错误</span>}
                 </label>
                 <input 
                   type="text"
                   value={unlockInput}
                   onChange={(e) => {
                     setUnlockInput(e.target.value);
                     setUnlockError(false);
                   }}
                   onKeyDown={(e) => e.key === 'Enter' && handleUnlockKey()}
                   className={`w-full bg-[#161f33] border rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all ${unlockError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'}`}
                   placeholder="请输入答案..."
                   autoFocus
                 />
               </div>

               <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => {
                     setShowUnlockModal(false);
                     setUnlockError(false);
                     setUnlockInput('');
                   }}
                   className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleUnlockKey}
                   className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-900/20"
                 >
                   确认解锁
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};
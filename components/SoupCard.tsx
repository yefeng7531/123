import React, { useState, useEffect } from 'react';
import { SoupData, SoupLogic, SoupTone, TONE_CONFIGS } from '../types';
import { Eye, EyeOff, Share2, AlertTriangle, Star, Dna, Code, X } from 'lucide-react';

interface SoupCardProps {
  data: SoupData;
  logic: SoupLogic;
  tone: SoupTone;
}

export const SoupCard: React.FC<SoupCardProps> = ({ data, logic, tone }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showPromptInfo, setShowPromptInfo] = useState(false);
  const toneConfig = TONE_CONFIGS[tone];

  // Reset states when data changes
  useEffect(() => {
    setIsRevealed(false);
    setShowPromptInfo(false);
  }, [data]);

  const handleCopy = () => {
    const text = `【${data.title}】\n类型：${logic}·${tone}\n\n汤面：\n${data.surface}\n\n汤底：\n|| ${data.bottom} ||`;
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板！");
  };

  return (
    <div className="flex flex-col w-full max-w-2xl gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* Header Info */}
      <div className="flex items-center justify-between text-slate-400 text-sm px-2 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
            <Dna className="w-3 h-3" />
            {logic}
          </div>
          {tone !== SoupTone.Default && (
            <div className={`px-2 py-1 rounded text-xs font-bold border ${toneConfig.borderColor} ${toneConfig.color} bg-slate-900/50`}>
                {tone}
            </div>
          )}
          
          <div className="flex text-amber-500 ml-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < data.difficulty ? 'fill-current' : 'text-slate-700 fill-none'}`} 
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
           {data.tags.map(tag => (
             <span key={tag} className="text-xs text-slate-600">#{tag}</span>
           ))}
        </div>
      </div>

      {/* Soup Surface (Question) */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
          <h1 className="text-3xl font-serif font-bold text-slate-100 mb-6 tracking-wide leading-tight">
            {data.title}
          </h1>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line font-serif text-lg">
              {data.surface}
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {/* View Prompt Button (Only if payload exists) */}
            {data.promptPayload && (
              <button
                onClick={() => setShowPromptInfo(true)}
                className="text-slate-600 hover:text-amber-500 transition-colors flex items-center gap-1 text-[10px] uppercase tracking-widest"
              >
                <Code className="w-3 h-3" /> 原始提示词
              </button>
            )}
            
            <button 
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-[10px] uppercase tracking-widest"
            >
              <Share2 className="w-3 h-3" /> 复制谜题
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 py-2 opacity-50">
        <div className="h-px bg-slate-700 w-full"></div>
        <div className="text-slate-600 font-serif italic text-sm shrink-0">真相永远只有一个</div>
        <div className="h-px bg-slate-700 w-full"></div>
      </div>

      {/* Soup Bottom (Answer) */}
      <div className="relative group">
        <div className={`
          relative overflow-hidden rounded-2xl border transition-all duration-500
          ${isRevealed 
            ? 'bg-slate-900 border-red-900/30' 
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 cursor-pointer'
          }
        `}>
          
          {/* Unrevealed State Overlay */}
          {!isRevealed && (
            <div 
              onClick={() => setIsRevealed(true)}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-md bg-slate-950/60 transition-all hover:bg-slate-950/50"
            >
              <Eye className="w-8 h-8 text-slate-400 mb-2 opacity-80" />
              <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">点击揭示汤底</span>
              {(tone === SoupTone.Red || tone === SoupTone.Black) && (
                 <div className="mt-2 flex items-center gap-1 text-red-500/70 text-xs">
                   <AlertTriangle className="w-3 h-3" />
                   <span>包含惊悚/暗黑内容</span>
                 </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`p-8 min-h-[160px] transition-all duration-500 ${isRevealed ? 'opacity-100 blur-0' : 'opacity-20 blur-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-500/80 font-serif font-bold text-lg">汤底 (真相)</h3>
              {isRevealed && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsRevealed(false); }}
                  className="text-slate-600 hover:text-slate-400"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-slate-300 leading-relaxed font-serif text-lg whitespace-pre-line">
              {data.bottom}
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Inspector Modal (Inline specific) */}
      {showPromptInfo && data.promptPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
               <div className="flex items-center gap-2 text-slate-200 font-bold">
                 <Code className="w-4 h-4 text-emerald-500" />
                 <span>Original Generation Prompt</span>
               </div>
               <button onClick={() => setShowPromptInfo(false)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="text-xs text-slate-500 font-mono">Model: {data.promptPayload.model}</div>
                <div className="space-y-1">
                   <div className="text-xs font-bold text-slate-500">SYSTEM</div>
                   <div className="bg-[#0f1219] p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap">{data.promptPayload.system}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-xs font-bold text-slate-500">USER</div>
                   <div className="bg-[#0f1219] p-3 rounded-lg border border-slate-800 text-xs font-mono text-blue-300 whitespace-pre-wrap">{data.promptPayload.user}</div>
                </div>
            </div>
           </div>
        </div>
      )}

    </div>
  );
};

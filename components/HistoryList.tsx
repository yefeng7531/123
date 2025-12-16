import React from 'react';
import { SoupData, TONE_CONFIGS, SoupTone } from '../types';
import { Trash2, Clock, Star, Dna } from 'lucide-react';

interface HistoryListProps {
  history: SoupData[];
  onSelect: (soup: SoupData) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClear: () => void;
  currentId?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  history, 
  onSelect, 
  onDelete, 
  onClear,
  currentId 
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-700 h-[400px]">
        <Clock className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm font-serif">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden max-h-[80vh] flex-1">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-slate-200 font-serif font-bold">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>历史记录 ({history.length})</span>
        </div>
        <button 
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-950/30 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> 清空
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
        {history.map((item) => {
          // Robust check: Ensure tone exists and is a valid key in TONE_CONFIGS. Fallback to Default otherwise.
          const toneKey = (item.tone && TONE_CONFIGS[item.tone]) ? item.tone : SoupTone.Default;
          const toneConfig = TONE_CONFIGS[toneKey];
          
          let diffColor = 'text-blue-400';
          if (item.difficulty >= 4) diffColor = 'text-red-400';
          else if (item.difficulty === 1) diffColor = 'text-emerald-400';

          return (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className={`
                group relative flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer
                ${currentId === item.id 
                  ? 'bg-slate-800 border-amber-500/50 shadow-md ring-1 ring-amber-500/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-serif font-bold text-sm line-clamp-1 ${currentId === item.id ? 'text-amber-100' : 'text-slate-200'}`}>
                  {item.title}
                </h3>
                <button
                  onClick={(e) => onDelete(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded transition-all absolute top-2 right-2"
                  title="删除此条"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className={`px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 ${toneConfig.color}`}>
                  {item.tone || '未知'}
                </span>
                {item.logic && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                    <Dna className="w-2.5 h-2.5" /> {item.logic}
                  </span>
                )}
                <div className="flex items-center gap-0.5 ml-auto">
                  <Star className={`w-3 h-3 ${diffColor} fill-current`} />
                  <span>{item.difficulty}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {item.surface}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
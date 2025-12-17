import React, { useState, useEffect } from 'react';
import { SoupLogic, SoupTone, SoupDifficulty, SoupData, AISettings } from './types';
import { generateSoup, SILICONFLOW_BASE_URL } from './services/geminiService';
import { Controls } from './components/Controls';
import { SoupCard } from './components/SoupCard';
import { HistoryList } from './components/HistoryList';
import { Skull, History, Sparkles } from 'lucide-react';

// Key for localStorage
const STORAGE_KEY = 'turtle_soup_history_v1';

const App: React.FC = () => {
  // --- Generator State ---
  const [logic, setLogic] = useState<SoupLogic>(SoupLogic.Classic);
  const [tone, setTone] = useState<SoupTone>(SoupTone.Default);
  const [difficulty, setDifficulty] = useState<SoupDifficulty>(SoupDifficulty.Normal);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  
  // Initialize with SiliconFlow specific defaults
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model: 'deepseek-ai/DeepSeek-V3',
    temperature: 1.3, // DeepSeek tends to be better with higher temp for creative writing
    baseUrl: SILICONFLOW_BASE_URL,
    apiKey: process.env.API_KEY || ''
  });

  // --- App Logic State ---
  const [currentSoup, setCurrentSoup] = useState<SoupData | null>(null);
  const [history, setHistory] = useState<SoupData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleGenerate = async (sysPromptOverride?: string, userPromptOverride?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateSoup(
        logic, 
        tone, 
        difficulty, 
        customPrompt, 
        aiSettings,
        sysPromptOverride,
        userPromptOverride
      );
      
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      
      const newSoup: SoupData = {
        ...result,
        id: id,
        timestamp: Date.now(),
        logic, 
        tone,  
      };

      setCurrentSoup(newSoup);
      setHistory(prev => [newSoup, ...prev].slice(0, 50)); 
    } catch (err: any) {
      setError(err.message || "Failed to generate soup. Please check connection settings.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (soup: SoupData) => {
    setCurrentSoup(soup);
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentSoup?.id === id) {
      setCurrentSoup(null);
    }
  };

  const handleClearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      setHistory([]);
      setCurrentSoup(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-200 relative overflow-x-hidden selection:bg-red-900 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 flex flex-col items-center">
        
        {/* Header */}
        <header className="mb-12 text-center relative group">
          <div className="flex items-center justify-center gap-3 mb-2">
             <Skull className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors duration-500" />
             <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-100 to-slate-500">
               海龟汤
             </h1>
             <Skull className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors duration-500 transform scale-x-[-1]" />
          </div>
          <p className="text-slate-500 font-serif italic text-sm md:text-base tracking-widest">
            LATERAL THINKING PUZZLES
          </p>
        </header>

        <main className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16 max-w-7xl">
          
          {/* Left Column: Sidebar (Tabs + Content) */}
          <aside className="w-full lg:w-[400px] flex flex-col gap-4 lg:sticky lg:top-8 shrink-0 transition-all">
            
            {/* Tabs Switcher */}
            <div className="flex p-1 bg-slate-900/80 backdrop-blur rounded-xl border border-slate-700 shadow-lg">
              <button 
                onClick={() => setActiveTab('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'create' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Sparkles className="w-4 h-4" />
                生成
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <History className="w-4 h-4" />
                历史
                {history.length > 0 && <span className="ml-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{history.length}</span>}
              </button>
            </div>

            {/* Content Area */}
            <div className="relative">
              {activeTab === 'create' ? (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <Controls 
                    logic={logic} setLogic={setLogic}
                    tone={tone} setTone={setTone}
                    difficulty={difficulty} setDifficulty={setDifficulty}
                    customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
                    aiSettings={aiSettings} setAiSettings={setAiSettings}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <HistoryList 
                    history={history}
                    onSelect={handleSelectHistory}
                    onDelete={handleDeleteHistory}
                    onClear={handleClearHistory}
                    currentId={currentSoup?.id}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Right Column: Display */}
          <section className="w-full flex-1 flex flex-col items-center min-h-[500px]">
            {error && (
              <div className="w-full p-4 mb-4 text-center text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl">
                {error}
              </div>
            )}
            
            {currentSoup ? (
              <SoupCard 
                data={currentSoup} 
                logic={currentSoup.logic || logic} 
                tone={currentSoup.tone || tone} 
              />
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-600 gap-4 opacity-50">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 animate-[spin_10s_linear_infinite]" />
                <p className="font-serif text-lg">
                  {history.length > 0 ? "点击左侧历史记录回看，或开始新的生成..." : "请在左侧配置规则，开始熬汤..."}
                </p>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};

export default App;
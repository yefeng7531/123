import React, { useState } from 'react';
import { SoupLogic, SoupTone, SoupData, AISettings } from './types';
import { generateSoup } from './services/geminiService';
import { Controls } from './components/Controls';
import { SoupCard } from './components/SoupCard';
import { Skull } from 'lucide-react';

const App: React.FC = () => {
  const [logic, setLogic] = useState<SoupLogic>(SoupLogic.Classic);
  const [tone, setTone] = useState<SoupTone>(SoupTone.Default);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model: 'gemini-2.5-flash',
    temperature: 1.1
  });

  const [currentSoup, setCurrentSoup] = useState<SoupData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await generateSoup(logic, tone, customPrompt, aiSettings);
      setCurrentSoup(data);
    } catch (err) {
      setError("熬汤失败，或是网络波动，或是灵感枯竭。请稍后再试。");
      console.error(err);
    } finally {
      setIsLoading(false);
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
          
          {/* Left Column: Controls */}
          <aside className="w-full lg:w-auto flex justify-center lg:sticky lg:top-8 shrink-0">
            <Controls 
              logic={logic}
              setLogic={setLogic}
              tone={tone}
              setTone={setTone}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              aiSettings={aiSettings}
              setAiSettings={setAiSettings}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </aside>

          {/* Right Column: Display */}
          <section className="w-full flex-1 flex flex-col items-center min-h-[500px]">
            {error && (
              <div className="w-full p-4 mb-4 text-center text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl">
                {error}
              </div>
            )}
            
            {currentSoup ? (
              <SoupCard data={currentSoup} logic={logic} tone={tone} />
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-600 gap-4 opacity-50">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 animate-[spin_10s_linear_infinite]" />
                <p className="font-serif text-lg">请在左侧配置规则，开始熬汤...</p>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};

export default App;
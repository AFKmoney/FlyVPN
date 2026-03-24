import React, { useState, useEffect, useRef } from 'react';
import { AGI_BREAKTHROUGHS } from '../../lib/agiBreakthroughs';

interface BlankSlateAGIProps {
  onClose: () => void;
}

export const BlankSlateAGI: React.FC<BlankSlateAGIProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isBooting, setIsBooting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const startBootstrapping = () => {
    setIsBooting(true);
    setCurrentStep(0);
    setLogs(['Initiating Blank Slate Protocol...', 'Zero-knowledge environment established.']);
  };

  useEffect(() => {
    if (isBooting && currentStep >= 0 && currentStep < AGI_BREAKTHROUGHS.length) {
      const timer = setTimeout(() => {
        const breakthrough = AGI_BREAKTHROUGHS[currentStep];
        setLogs(prev => [...prev, `Applying ${breakthrough.name}...`, `> ${breakthrough.usage}`]);
        setCurrentStep(prev => prev + 1);
      }, 1000); // Faster for better feel
      return () => clearTimeout(timer);
    } else if (currentStep === AGI_BREAKTHROUGHS.length) {
        setIsBooting(false);
        setLogs(prev => [...prev, 'Bootstrapping complete.', 'AGI Core stabilized.', 'Blank Slate Problem: SOLVED.']);
    }
  }, [isBooting, currentStep]);

  const progress = (Math.max(0, currentStep) / AGI_BREAKTHROUGHS.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl flex flex-col z-[60] animate-in fade-in duration-500">
        <style>{`
            @keyframes resonance {
                0% { transform: scale(1); opacity: 0.3; border-color: rgba(34, 211, 238, 0.2); }
                50% { transform: scale(1.1); opacity: 0.6; border-color: rgba(34, 211, 238, 0.5); }
                100% { transform: scale(1); opacity: 0.3; border-color: rgba(34, 211, 238, 0.2); }
            }
            .resonance-field {
                animation: resonance 4s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(5deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
            .floating-concept {
                animation: float 6s ease-in-out infinite;
            }
            .grid-background {
                background-image:
                    linear-gradient(to right, rgba(34, 211, 238, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
                background-size: 40px 40px;
                perspective: 1000px;
            }
            .matrix-text {
                text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
            }
        `}</style>

        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center glow-cyan">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tighter text-white uppercase leading-none matrix-text">Blank Slate AGI Core</h2>
                    <p className="text-[10px] text-slate-500 tracking-[0.3em] font-bold uppercase mt-1">Deeptech Bootstrapping Protocol</p>
                </div>
            </div>
            <button onClick={onClose} className="text-3xl text-slate-500 hover:text-white transition-colors">&times;</button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden grid-background">

            {/* Visualizer Area */}
            <div className="flex-[3] glass rounded-3xl relative overflow-hidden flex items-center justify-center border-cyan-500/10 min-h-[400px]">
                {currentStep === -1 ? (
                    <div className="text-center space-y-6">
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 mx-auto flex items-center justify-center opacity-50">
                            <div className="w-16 h-16 rounded-full border border-slate-800"></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-400">Void State Detected</h3>
                            <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">The AGI core is currently in a zero-entropy state. Initiation required.</p>
                        </div>
                        <button
                            onClick={startBootstrapping}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34, 211, 238, 0.4)]"
                        >
                            INITIATE BOOTSTRAP
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Dynamic Resonance Fields */}
                        <div className={`absolute w-64 h-64 rounded-full border-2 resonance-field ${currentStep > 5 ? 'opacity-100' : 'opacity-20'}`}></div>
                        <div className={`absolute w-[400px] h-[400px] rounded-full border border-dashed resonance-field opacity-10`} style={{animationDelay: '1s'}}></div>
                        <div className={`absolute w-[600px] h-[600px] rounded-full border border-dotted resonance-field opacity-5`} style={{animationDelay: '2s'}}></div>

                        {/* Concept Nodes */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-32 h-32 bg-cyan-500/10 rounded-full border-4 border-cyan-400/50 flex items-center justify-center glow-cyan animate-pulse-fast">
                                <span className="text-4xl font-black text-cyan-400">{Math.min(currentStep, AGI_BREAKTHROUGHS.length)}</span>
                            </div>
                            <div className="mt-8 text-center">
                                <div className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-1">Current Breakthrough</div>
                                <div className="text-2xl font-bold text-white max-w-md h-16">
                                    {currentStep < AGI_BREAKTHROUGHS.length ? AGI_BREAKTHROUGHS[currentStep]?.name : 'STABILIZED'}
                                </div>
                            </div>
                        </div>

                        {/* Floating Concept Words */}
                        {currentStep > 0 && AGI_BREAKTHROUGHS.slice(Math.max(0, currentStep - 12), currentStep).map((b, i) => (
                            <div
                                key={b.id + i}
                                className="absolute text-[10px] font-black uppercase tracking-tighter text-cyan-400/40 floating-concept"
                                style={{
                                    top: `${15 + ((i * 7) % 70)}%`,
                                    left: `${15 + ((i * 13) % 70)}%`,
                                    animationDelay: `${i * 0.3}s`
                                }}
                            >
                                {b.id.replace(/-/g, ' ')}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Side Info Panel */}
            <div className="flex-[2] flex flex-col gap-6 overflow-hidden">

                {/* Stats Card */}
                <div className="glass rounded-2xl p-6 border-cyan-500/10 flex-shrink-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Core Integration Status</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-400">Semantic Complexity</span>
                                <span className="text-cyan-400">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-1000" style={{width: `${progress}%`}}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <div className="text-[9px] font-bold text-slate-500 uppercase">Entropy</div>
                                <div className="text-sm font-bold text-slate-200">{Math.max(0, 100 - Math.round(progress))}%</div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <div className="text-[9px] font-bold text-slate-500 uppercase">Synaptic Edges</div>
                                <div className="text-sm font-bold text-slate-200">{Math.max(0, currentStep) * 42}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log View */}
                <div className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0 border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Execution Log</h4>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20"></div>
                        </div>
                    </div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] scrollbar-hide">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.startsWith('>') ? 'text-slate-500 ml-3' : 'text-cyan-400 font-bold'}`}>
                                {log}
                            </div>
                        ))}
                        {isBooting && (
                             <div className="text-cyan-400 animate-pulse">_</div>
                        )}
                    </div>
                </div>

                {/* Breakthrough Detail */}
                <div className="glass rounded-2xl p-6 border-white/5 bg-slate-900/20 flex-shrink-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Active Breakthrough Analysis</h4>
                    {currentStep >= 0 && currentStep < AGI_BREAKTHROUGHS.length ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="text-sm font-bold text-white">{AGI_BREAKTHROUGHS[currentStep].name}</div>
                            <div className="text-[10px] text-cyan-500 font-bold mt-1 uppercase tracking-wider">{AGI_BREAKTHROUGHS[currentStep].category} Layer</div>
                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{AGI_BREAKTHROUGHS[currentStep].concept}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 italic">{currentStep === AGI_BREAKTHROUGHS.length ? 'System Optimized.' : 'Awaiting initiation...'}</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

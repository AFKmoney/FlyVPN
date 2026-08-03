import React, { useState, useEffect, useRef } from 'react';
import { AGI_BREAKTHROUGHS } from '../../lib/agiBreakthroughs';
import { agi, ConceptState, ReasoningEvent } from '../../services/agiService';
import { useAppContext } from '../../contexts/LocalizationContext';

interface BlankSlateAGIProps {
    onClose: () => void;
}

export const BlankSlateAGI: React.FC<BlankSlateAGIProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [snapshot, setSnapshot] = useState<ConceptState[]>([]);
    const [bootstrapped, setBootstrapped] = useState(false);
    const [bootMs, setBootMs] = useState<number | null>(null);
    const [bootStart, setBootStart] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user, config } = useAppContext();

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs]);

    useEffect(() => {
        agi.init(AGI_BREAKTHROUGHS);
        agi.start();

        const offEvent = agi.on((e: ReasoningEvent) => {
            const time = new Date(e.ts).toLocaleTimeString();
            const level = e.type === 'fire' ? 'fire' : e.type === 'decay' ? 'warn' : e.type === 'bootstrap-end' ? 'ok' : 'info';
            setLogs(prev => [...prev, `[${time}] <${level}> ${e.detail}`].slice(-200));
            if (e.type === 'fire' || e.type === 'activate' || e.type === 'decay') {
                setSnapshot(agi.getSnapshot());
            }
            if (e.type === 'bootstrap-end') {
                setBootstrapped(true);
                setBootMs(e.ts - (bootStart ?? e.ts));
            }
        });

        const snapInterval = window.setInterval(() => setSnapshot(agi.getSnapshot()), 500);

        return () => { offEvent(); clearInterval(snapInterval); agi.stop(); };
    }, [bootStart]);

    const startBootstrapping = () => {
        setBootstrapped(false);
        setBootMs(null);
        setLogs([]);
        setSnapshot([]);
        agi.init(AGI_BREAKTHROUGHS);
        agi.setInputs({ config: config as any, tunnelRtt: 50, threatsNeutralized: 0 });
        setBootStart(Date.now());
        agi.bootstrap();
    };

    const firedCount = snapshot.filter(s => s.fired).length;
    const totalCount = AGI_BREAKTHROUGHS.length;
    const progress = totalCount > 0 ? (firedCount / totalCount) * 100 : 0;
    const meanCoherence = snapshot.length > 0 ? (snapshot.reduce((s, c) => s + c.coherence, 0) / snapshot.length) : 0;

    return (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl flex flex-col z-[60] animate-in fade-in duration-500">
            <style>{`
            @keyframes resonance { 0% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 0.6; } 100% { transform: scale(1); opacity: 0.3; } }
            .resonance-field { animation: resonance 4s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
            .floating-concept { animation: float 6s ease-in-out infinite; }
            .grid-background { background-image: linear-gradient(to right, rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.05) 1px, transparent 1px); background-size: 40px 40px; }
            .matrix-text { text-shadow: 0 0 8px rgba(34, 211, 238, 0.5); }
            @keyframes firing-pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.6); } 100% { box-shadow: 0 0 0 20px rgba(34, 211, 238, 0); } }
            .firing { animation: firing-pulse 1s ease-out; }
        `}</style>

            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center glow-cyan">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white uppercase leading-none matrix-text">Blank Slate AGI Core</h2>
                        <p className="text-[10px] text-slate-500 tracking-[0.3em] font-bold uppercase mt-1">Real-time Concept Activation Engine</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-3xl text-slate-500 hover:text-white transition-colors">&times;</button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden grid-background">
                <div className="lg:w-1/2 flex flex-col gap-6 min-h-0">
                    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                        <div className={`w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative ${bootstrapped ? 'bg-emerald-500/10' : 'bg-cyan-500/5 resonance-field'}`}>
                            <span className="text-3xl font-black text-cyan-400">{Math.round(meanCoherence * 100)}%</span>
                        </div>
                        <div className="w-full">
                            <h3 className="text-2xl font-black text-white uppercase tracking-wider">Coherence Score</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                {bootstrapped ? `Stabilized in ${(bootMs! / 1000).toFixed(1)}s` : firedCount + ' / ' + totalCount + ' concepts coherent'}
                            </p>
                            <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
                                <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <button
                            onClick={startBootstrapping}
                            disabled={!bootstrapped === false && bootStart !== null}
                            className="mt-2 px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-black uppercase text-xs tracking-widest rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {bootstrapped ? '↻ Re-Bootstrap' : '▶ Bootstrap Core'}
                        </button>
                    </div>

                    <div className="glass rounded-2xl p-4 flex-1 flex flex-col min-h-0">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 flex-shrink-0">Reasoning Trace</h3>
                        <div ref={scrollRef} className="overflow-y-auto pr-2 flex-1 text-[10px] mono space-y-0.5 max-h-80">
                            {logs.length === 0 && <div className="text-slate-500 italic text-center py-4">Press Bootstrap to begin activation.</div>}
                            {logs.map((l, i) => {
                                const level = l.match(/<(fire|ok|warn)>/)?.[1];
                                return (
                                    <div key={i} className={`px-2 py-0.5 rounded ${level === 'fire' ? 'bg-cyan-500/10 text-cyan-300' : level === 'ok' ? 'bg-emerald-500/10 text-emerald-300' : level === 'warn' ? 'bg-amber-500/10 text-amber-300' : 'text-slate-300'}`}>
                                        {l}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/2 glass rounded-2xl p-6 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <span>Concept Activation Graph</span>
                        <span className="text-[10px] text-slate-500 mono">{snapshot.length} nodes</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {snapshot.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-slate-500 italic text-sm">No concepts primed. Bootstrap to activate.</div>
                        ) : snapshot.map(s => (
                            <div key={s.id} className={`p-2 rounded-lg border transition-all ${s.fired ? 'border-cyan-500/50 bg-cyan-500/10 firing' : 'border-white/5 bg-slate-900/40'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-[11px] font-bold text-slate-100 leading-tight flex-1 min-w-0">{s.name}</div>
                                    <div className={`mono text-[10px] font-bold shrink-0 ${s.fired ? 'text-cyan-400' : 'text-slate-500'}`}>
                                        {Math.round(s.activation * 100)}%
                                    </div>
                                </div>
                                <div className="text-[9px] uppercase text-slate-500 mt-0.5">{s.category}</div>
                                <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${s.fired ? 'bg-cyan-400' : s.activation > 0.4 ? 'bg-amber-400' : 'bg-slate-600'}`}
                                        style={{ width: `${Math.min(100, s.activation * 100)}%` }}
                                    ></div>
                                </div>
                                {s.firingCount > 1 && <div className="text-[9px] text-cyan-400 mono mt-1">fired × {s.firingCount}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

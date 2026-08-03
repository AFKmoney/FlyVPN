import React, { useState, useEffect, useMemo, useReducer, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { PacketEvent, startPacketPipeline, stopPacketPipeline, onPacket, getDestinationPoolSnapshot, AppType } from '../../services/packetPipeline';
import { useAppContext } from '../../contexts/LocalizationContext';

const appColors: Record<AppType, string> = {
    'System':    '#f43f5e',
    'Browser':   '#38bdf8',
    'App':       '#34d399',
    'Service':   '#a78bfa',
    'Streaming': '#fb923c',
    'Crypto':    '#facc15',
};

// --- Reducer for state management ---
type PacketState = {
    packets: PacketEvent[];
    totalPackets: number;
    totalData: number;
    byApp: Record<string, number>;
    byProto: Record<string, number>;
};
type PacketAction = { type: 'ADD_PACKETS'; payload: PacketEvent[] } | { type: 'CLEAR' };

const packetReducer = (state: PacketState, action: PacketAction): PacketState => {
    switch (action.type) {
        case 'ADD_PACKETS': {
            const newPackets = action.payload;
            const byApp = { ...state.byApp };
            const byProto = { ...state.byProto };
            let totalData = state.totalData;
            for (const p of newPackets) {
                byApp[p.app] = (byApp[p.app] || 0) + 1;
                byProto[p.protocol] = (byProto[p.protocol] || 0) + 1;
                totalData += p.size;
            }
            return {
                packets: [...state.packets, ...newPackets].slice(-300),
                totalPackets: state.totalPackets + newPackets.length,
                totalData,
                byApp,
                byProto,
            };
        }
        case 'CLEAR':
            return { packets: [], totalPackets: 0, totalData: 0, byApp: {}, byProto: {} };
        default:
            return state;
    }
};

const initialState: PacketState = { packets: [], totalPackets: 0, totalData: 0, byApp: {}, byProto: {} };


export const PacketFlowVisualizer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [state, dispatch] = useReducer(packetReducer, initialState);
    const { packets, totalPackets, totalData, byApp, byProto } = state;
    const { user } = useAppContext();
    const [paused, setPaused] = useState(false);
    const [poolSize, setPoolSize] = useState(0);
    const [liveStatus, setLiveStatus] = useState<'live' | 'idle' | 'paused'>('idle');

    // Wire up the real pipeline
    useEffect(() => {
        const srcIp = user.virtualIP !== 'N/A' ? user.virtualIP : (user.realIP || '10.0.0.1');
        startPacketPipeline({ srcIp });
        setLiveStatus('live');
        const off = onPacket((p) => {
            if (paused) return;
            dispatch({ type: 'ADD_PACKETS', payload: [p] });
        });
        const poll = window.setInterval(() => setPoolSize(getDestinationPoolSnapshot().length), 2000);
        return () => { off(); stopPacketPipeline(); clearInterval(poll); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.virtualIP, user.realIP, paused]);

    useEffect(() => { setLiveStatus(paused ? 'paused' : 'live'); }, [paused]);

    const recentPackets = useMemo(() => [...packets].reverse(), [packets]);

    const sortedApps = useMemo(
        () => (Object.entries(byApp) as [string, number][]).sort((a, b) => b[1] - a[1]),
        [byApp]
    );
    const sortedProtos = useMemo(
        () => (Object.entries(byProto) as [string, number][]).sort((a, b) => b[1] - a[1]),
        [byProto]
    );

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm p-4 sm:p-8 flex flex-col z-50 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-cyan-400">Packet Flow Visualizer</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${liveStatus === 'live' ? 'bg-emerald-500/20 text-emerald-400' : liveStatus === 'paused' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                        ● {liveStatus === 'live' ? 'Live pipeline' : liveStatus === 'paused' ? 'Paused' : 'Idle'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 mono">
                        {poolSize} resolved destinations
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded ${paused ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400' : 'bg-slate-800 text-slate-300 border border-white/10'}`}
                    >
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'CLEAR' })}
                        className="text-[10px] uppercase font-bold px-3 py-1.5 rounded border border-white/10 text-slate-300 hover:text-rose-400"
                    >
                        Clear
                    </button>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white transition-colors px-2">&times;</button>
                </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
                <div className="lg:w-2/3 glass rounded-2xl p-4 relative h-80 lg:h-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis type="number" dataKey="ts" domain={['dataMin', 'dataMax']} tick={false} axisLine={false} name="time" />
                            <YAxis type="number" dataKey="dstPort" name="port" stroke="rgba(255,255,255,0.3)" label={{ value: 'dst port', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <ZAxis type="number" dataKey="size" range={[20, 400]} name="size" unit="B" />
                            <Tooltip
                                content={({ active, payload }: any) => {
                                    if (!active || !payload?.[0]) return null;
                                    const p = payload[0].payload as PacketEvent;
                                    return (
                                        <div className="glass p-2 rounded text-[10px] mono border border-white/10">
                                            <div style={{ color: appColors[p.app] }} className="font-bold">{p.app} → {p.notes ?? p.protocol}</div>
                                            <div className="text-slate-300">{p.srcIp}:{p.srcPort} → {p.dstIp}:{p.dstPort}</div>
                                            <div className="text-slate-500">{p.size}B · {p.protocol} · {p.direction.toUpperCase()}</div>
                                        </div>
                                    );
                                }}
                            />
                            <Scatter data={packets} animationDuration={300} isAnimationActive={false}>
                                {packets.map((entry) => (
                                    <Cell key={entry.id} fill={appColors[entry.app]} opacity={entry.direction === 'in' ? 0.85 : 0.55} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:w-1/3 flex flex-col gap-4 min-h-0 flex-1 lg:flex-initial overflow-y-auto lg:overflow-y-visible">
                    <div className="glass rounded-2xl p-3">
                        <h3 className="text-sm font-bold text-slate-300 mb-2">App Distribution</h3>
                        <div className="space-y-1 text-xs">
                            {sortedApps.length === 0 && <div className="text-slate-500 italic text-[10px]">Waiting for traffic…</div>}
                            {sortedApps.map(([app, count]) => (
                                <div key={app} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: appColors[app as AppType] }}></div>
                                    <span className="font-semibold text-slate-200 w-20">{app}</span>
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-500" style={{ backgroundColor: appColors[app as AppType], width: `${Math.min(100, (count / Math.max(1, totalPackets)) * 100)}%` }}></div>
                                    </div>
                                    <span className="mono text-slate-400 w-10 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-3">
                        <h3 className="text-sm font-bold text-slate-300 mb-2">Protocol Stats</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {sortedProtos.map(([proto, count]) => (
                                <div key={proto} className="bg-slate-900/50 rounded p-2 border border-white/5">
                                    <div className="text-[9px] uppercase font-bold text-slate-500">{proto}</div>
                                    <div className="mono font-bold text-cyan-400">{count}</div>
                                </div>
                            ))}
                            {sortedProtos.length === 0 && <div className="col-span-2 text-slate-500 italic text-[10px] text-center py-2">No packets yet</div>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Total Packets:</span><span className="font-bold mono">{totalPackets}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Data Transferred:</span><span className="font-bold mono">{(totalData / 1024 / 1024).toFixed(2)} MB</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Resolved Destinations:</span><span className="font-bold mono">{poolSize}</span></div>
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-3 flex-1 flex flex-col min-h-0">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 flex-shrink-0">Live Packet Log</h3>
                        <div className="overflow-y-auto pr-2 flex-1 text-[10px] mono max-h-80">
                            {recentPackets.length === 0 && <div className="text-slate-500 italic text-center py-4">No packets captured.</div>}
                            {recentPackets.map(p => (
                                <div key={p.id} className="grid grid-cols-12 gap-1 py-1 border-b border-white/5 hover:bg-white/5">
                                    <span style={{ color: appColors[p.app] }} className="font-bold col-span-2 truncate">{p.app}</span>
                                    <span className="text-slate-400 col-span-5 truncate">{p.dstIp}:{p.dstPort}</span>
                                    <span className="text-slate-500 col-span-2">{p.protocol}</span>
                                    <span className={`col-span-1 text-right ${p.direction === 'in' ? 'text-emerald-400' : 'text-indigo-400'}`}>{p.direction === 'in' ? '↓' : '↑'}</span>
                                    <span className="text-slate-300 col-span-2 text-right">{p.size}B</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

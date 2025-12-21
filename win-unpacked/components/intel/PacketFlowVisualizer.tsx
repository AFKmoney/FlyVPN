import React, { useState, useEffect, useMemo, useRef, useReducer, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Cell } from 'recharts';

const apps = ['System', 'Browser', 'App', 'Service'];
const protocols = ['TCP', 'UDP'];
const appColors: { [key: string]: string } = {
    'System': '#f43f5e', // rose-500
    'Browser': '#38bdf8', // sky-400
    'App': '#34d399', // emerald-400
    'Service': '#a78bfa', // violet-400
};

type Packet = {
    id: number;
    time: number;
    port: number;
    size: number;
    app: string;
    protocol: string;
    dest: string;
};

let packetId = 0;

const generatePacket = (appType?: string): Packet => {
    return {
        id: packetId++,
        time: Date.now(),
        port: Math.floor(1024 + Math.random() * 64511),
        size: Math.floor(50 + Math.random() * 1450),
        app: appType || apps[Math.floor(Math.random() * apps.length)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        dest: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    };
};

// --- Reducer for state management ---
type PacketState = {
    packets: Packet[];
    totalPackets: number;
    totalData: number;
};
type PacketAction = { type: 'ADD_PACKETS'; payload: Packet[] };

const packetReducer = (state: PacketState, action: PacketAction): PacketState => {
    switch(action.type) {
        case 'ADD_PACKETS':
            return {
                packets: [...state.packets, ...action.payload].slice(-200),
                totalPackets: state.totalPackets + action.payload.length,
                totalData: state.totalData + action.payload.reduce((sum, p) => sum + p.size, 0)
            };
        default:
            return state;
    }
};

const initialState: PacketState = { packets: [], totalPackets: 0, totalData: 0 };


export const PacketFlowVisualizer: React.FC<{onClose: () => void}> = ({onClose}) => {
    const [state, dispatch] = useReducer(packetReducer, initialState);
    const { packets, totalPackets, totalData } = state;
    const timeoutRef = useRef<number | undefined>(undefined);

    const scheduleNextPacket = useCallback(() => {
        const nextTime = Math.random() * 800 + 100;
        timeoutRef.current = window.setTimeout(() => {
            let newPackets: Packet[] = [];
            // Chance to generate a burst
            if (Math.random() < 0.1) { 
                const burstSize = Math.floor(Math.random() * 10) + 5;
                for (let i = 0; i < burstSize; i++) {
                    newPackets.push(generatePacket('Browser'));
                }
            } else { // Generate a single packet
                const app = Math.random() < 0.2 ? 'System' : 'Service';
                newPackets.push(generatePacket(app));
            }

            dispatch({ type: 'ADD_PACKETS', payload: newPackets });
            scheduleNextPacket();
        }, nextTime);
    }, []);

    useEffect(() => {
        scheduleNextPacket();
        return () => clearTimeout(timeoutRef.current);
    }, [scheduleNextPacket]);
    
    const recentPackets = useMemo(() => [...packets].reverse(), [packets]);

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col z-50 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-cyan-400">Packet Flow Visualizer</h2>
                <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white transition-colors">&times;</button>
            </div>
             <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
                <div className="lg:w-2/3 glass rounded-2xl p-4 relative h-80 lg:h-auto">
                    <ResponsiveContainer width="100%" height="100%">
                         <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis type="number" dataKey="time" domain={['dataMin', 'dataMax']} tick={false} axisLine={false} />
                            <YAxis type="number" dataKey="port" name="port" unit="" stroke="rgba(255,255,255,0.3)" />
                            <ZAxis type="number" dataKey="size" range={[50, 500]} name="size" unit="B" />
                            <Scatter data={packets} fill="#8884d8" animationDuration={500} isAnimationActive={true}>
                                {packets.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={appColors[entry.app]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:w-1/3 flex flex-col gap-4 min-h-0 flex-1 lg:flex-initial">
                     <div className="glass rounded-2xl p-3">
                        <h3 className="text-sm font-bold text-slate-300 mb-2">Legend & Stats</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                           {Object.keys(appColors).map(app => (
                               <div key={app} className="flex items-center gap-2">
                                   <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: appColors[app]}}></div>
                                   <span>{app}</span>
                               </div>
                           ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Packets:</span>
                                <span className="font-bold mono">{totalPackets}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-slate-400">Data Transferred:</span>
                                <span className="font-bold mono">{(totalData / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                     </div>
                     <div className="glass rounded-2xl p-4 flex-1 flex flex-col min-h-0">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 flex-shrink-0">Live Packet Log</h3>
                         <div className="overflow-y-auto pr-2 flex-1 text-[10px] mono">
                             {recentPackets.map(p => (
                                <div key={p.id} className="grid grid-cols-5 gap-2 py-1 border-b border-white/5 animate-in fade-in slide-in-from-top-1 duration-300">
                                   <span style={{color: appColors[p.app]}} className="font-bold">{p.app}</span>
                                   <span className="text-slate-400 col-span-2">{p.dest}:{p.port}</span>
                                   <span className="text-slate-500">{p.protocol}</span>
                                   <span className="text-slate-300 text-right">{p.size}B</span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
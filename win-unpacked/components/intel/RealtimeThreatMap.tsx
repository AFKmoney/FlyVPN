import React, { useState, useEffect, useMemo, useRef, useReducer, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';

// --- Threat & Map Data ---
const weightedThreatTypes = ['Phishing', 'Phishing', 'Phishing', 'Malware', 'Malware', 'DDoS', 'Spyware', 'Adware'];
const threatTypes = ['Malware', 'Phishing', 'DDoS', 'Spyware', 'Adware'];
const counterMeasures = ["Filesystem Index Corruption", "PSU Overvolt Signal Sent", "Force-Eject Optical Drive", "DNS Cache Poisoning", "Null Route Injected"];
const countries: Record<string, { lat: number, lon: number, weight: number, ipPrefix: string }> = { "Russia": { lat: 61.5240, lon: 105.3188, weight: 10, ipPrefix: '91.192' }, "China": { lat: 35.8617, lon: 104.1954, weight: 12, ipPrefix: '113.88' }, "North Korea": { lat: 40.3399, lon: 127.5101, weight: 7, ipPrefix: '175.45' }, "Iran": { lat: 32.4279, lon: 53.6880, weight: 6, ipPrefix: '80.75' }, "Brazil": { lat: -14.2350, lon: -51.9253, weight: 5, ipPrefix: '189.1' }, "Nigeria": { lat: 9.0820, lon: 8.6753, weight: 4, ipPrefix: '105.112' }, "United States": { lat: 38.0, lon: -97.0, weight: 3, ipPrefix: '68.180' }, "Germany": { lat: 51.0, lon: 9.0, weight: 3, ipPrefix: '84.116' }, "India": { lat: 20.5937, lon: 78.9629, weight: 4, ipPrefix: '115.96' }, "Vietnam": { lat: 14.0583, lon: 108.2772, weight: 4, ipPrefix: '113.160' }};
const countryPool = Object.entries(countries).flatMap(([name, data]) => Array(data.weight).fill(name));

type ThreatStatus = 'detecting' | 'neutralizing' | 'neutralized';
type Threat = { id: number; type: string; sourceCountry: string; sourceCoords: { lat: number, lon: number }; ip: string; timestamp: number; status: ThreatStatus; counterMeasure?: string };
type AnimationLine = { id: number; positions: [number, number][]; color: string; };

const generateThreatIP = (prefix: string) => `${prefix}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

const userIcon = new L.DivIcon({
    html: `<div class="user-location-pulse"></div>`,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// --- State Management via Reducer ---
type MapState = {
  threats: Threat[];
  threatStats: Record<string, number>;
  activeLines: AnimationLine[];
};

type MapAction =
  | { type: 'ADD_THREAT'; payload: { threat: Threat; line: AnimationLine } }
  | { type: 'START_NEUTRALIZE'; payload: { threatId: number; line: AnimationLine } }
  | { type: 'FINISH_NEUTRALIZE'; payload: { threatId: number; counterMeasure: string } }
  | { type: 'CLEAR_LINE'; payload: number };

const initialState: MapState = {
  threats: [],
  threatStats: threatTypes.reduce((acc, type) => ({...acc, [type]: 0}), {}),
  activeLines: [],
};

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'ADD_THREAT': {
      const { threat, line } = action.payload;
      return {
        ...state,
        threats: [threat, ...state.threats].slice(0, 50),
        threatStats: { ...state.threatStats, [threat.type]: (state.threatStats[threat.type] || 0) + 1 },
        activeLines: [...state.activeLines, line]
      };
    }
    case 'START_NEUTRALIZE': {
        const { threatId, line } = action.payload;
        return {
            ...state,
            threats: state.threats.map(t => t.id === threatId ? { ...t, status: 'neutralizing' } : t),
            activeLines: [...state.activeLines, line]
        };
    }
    case 'FINISH_NEUTRALIZE': {
      const { threatId, counterMeasure } = action.payload;
      return {
        ...state,
        threats: state.threats.map(t => t.id === threatId ? { ...t, status: 'neutralized', counterMeasure } : t),
        activeLines: state.activeLines.filter(l => l.id !== threatId + 10000)
      };
    }
    case 'CLEAR_LINE':
      return { ...state, activeLines: state.activeLines.filter(l => l.id !== action.payload) };
    default:
      return state;
  }
};

const ThreatDossier = ({ threat, onClose }: { threat: Threat, onClose: () => void }) => (
    <div className="absolute top-0 right-0 h-full w-64 glass p-4 z-[1000] flex flex-col animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-rose-400">Threat Dossier</h3>
            <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="text-xs space-y-3">
            <div><div className="text-slate-500 font-bold uppercase text-[10px]">Threat Type</div><div className="font-semibold text-slate-200">{threat.type}</div></div>
            <div><div className="text-slate-500 font-bold uppercase text-[10px]">Source</div><div className="font-semibold text-slate-200">{threat.sourceCountry}</div></div>
            <div><div className="text-slate-500 font-bold uppercase text-[10px]">IP Address</div><div className="mono text-slate-300">{threat.ip}</div></div>
            <div><div className="text-slate-500 font-bold uppercase text-[10px]">Threat Level</div><div className="font-bold text-amber-400">High</div></div>
            <div><div className="text-slate-500 font-bold uppercase text-[10px]">Timestamp</div><div className="mono text-slate-400">{new Date(threat.timestamp).toLocaleString()}</div></div>
            <div className="pt-2 border-t border-white/10">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Status</div>
                {threat.status === 'neutralized' 
                    ? <div className="font-semibold text-cyan-400">Neutralized</div>
                    : <div className="font-semibold text-amber-400 animate-pulse">{threat.status === 'detecting' ? 'Analyzing...' : 'Countermeasure Active...'}</div>
                }
            </div>
            {threat.counterMeasure && <div><div className="text-slate-500 font-bold uppercase text-[10px]">Countermeasure</div><div className="font-semibold text-cyan-400">{threat.counterMeasure}</div></div>}
        </div>
    </div>
);

interface RealtimeThreatMapProps {
    onClose: () => void;
    onNeutralize?: (type: string) => void;
    userLocation: { lat: number; lon: number } | null;
}

export const RealtimeThreatMap: React.FC<RealtimeThreatMapProps> = ({onClose, onNeutralize, userLocation}) => {
    const [state, dispatch] = useReducer(mapReducer, initialState);
    const { threats, threatStats, activeLines } = state;
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!userLocation) return;
            
            const countryName = countryPool[Math.floor(Math.random() * countryPool.length)];
            const countryData = countries[countryName];
            const newThreat: Threat = { id: Date.now() + Math.random(), type: weightedThreatTypes[Math.floor(Math.random() * weightedThreatTypes.length)], sourceCountry: countryName, sourceCoords: countryData, ip: generateThreatIP(countryData.ipPrefix), timestamp: Date.now(), status: 'detecting' };
            const attackLine: AnimationLine = { id: newThreat.id, positions: [[countryData.lat, countryData.lon], [userLocation.lat, userLocation.lon]], color: '#ef4444'};
            
            dispatch({ type: 'ADD_THREAT', payload: { threat: newThreat, line: attackLine } });

            setTimeout(() => dispatch({ type: 'CLEAR_LINE', payload: newThreat.id }), 1000);

            setTimeout(() => {
                const neutralizeLine: AnimationLine = { id: newThreat.id + 10000, positions: [[userLocation.lat, userLocation.lon], [newThreat.sourceCoords.lat, newThreat.sourceCoords.lon]], color: '#22d3ee'};
                dispatch({ type: 'START_NEUTRALIZE', payload: { threatId: newThreat.id, line: neutralizeLine }});

                setTimeout(() => {
                    const counterMeasure = counterMeasures[Math.floor(Math.random() * counterMeasures.length)];
                    dispatch({ type: 'FINISH_NEUTRALIZE', payload: { threatId: newThreat.id, counterMeasure } });
                    onNeutralize?.(newThreat.type);
                    if (selectedThreat?.id === newThreat.id) {
                        setSelectedThreat(t => t && ({...t, status: 'neutralized', counterMeasure}));
                    }
                }, 800);

            }, 500);

        }, 2000);
        return () => clearInterval(interval);
    }, [onNeutralize, userLocation, selectedThreat?.id]);

    const handleToggleFullscreen = () => {
        if (!modalRef.current) return;
        if (!document.fullscreenElement) {
            modalRef.current.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const chartData = useMemo(() => threatTypes.map(type => ({ name: type, count: threatStats[type] || 0 })).sort((a,b) => b.count - a.count), [threatStats]);
    const statusDisplay: Record<ThreatStatus, React.ReactElement> = { detecting: <span className="text-amber-400">Detecting...</span>, neutralizing: <span className="text-cyan-400 animate-pulse">Neutralizing...</span>, neutralized: <span className="text-slate-500">Neutralized</span> };

    return (
        <div ref={modalRef} className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col z-50 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0"><h2 className="text-xl font-bold text-cyan-400">Real-time Threat Map</h2><button onClick={onClose} className="text-2xl text-slate-400 hover:text-white transition-colors">&times;</button></div>
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                <div className="flex-[2] glass rounded-2xl p-0 relative overflow-hidden border-0">
                    <MapContainer center={[20, 30]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} className="map-container">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'/>
                        {userLocation && <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />}
                        {threats.filter(t => t.status !== 'neutralized').map(threat => (
                            <CircleMarker key={threat.id} center={[threat.sourceCoords.lat, threat.sourceCoords.lon]} radius={5} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 }} eventHandlers={{ click: () => setSelectedThreat(threat) }}/>
                        ))}
                        {activeLines.map(line => <Polyline key={line.id} positions={line.positions as any} color={line.color} weight={1.5} opacity={0.7} />)}
                    </MapContainer>
                    <div className="absolute top-2 left-2 z-[1000]"><button onClick={handleToggleFullscreen} className="w-8 h-8 glass rounded-md hover:bg-slate-700 transition-colors flex items-center justify-center" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 4H4v4m12 0V4h-4M8 20H4v-4m12 0v4h-4" /></svg> : <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>}</button></div>
                    {selectedThreat && <ThreatDossier threat={selectedThreat} onClose={() => setSelectedThreat(null)} />}
                </div>
                <div className="flex-[1] flex flex-col gap-4 min-h-0">
                    <div className="glass rounded-2xl p-4 flex-1 flex flex-col min-h-0">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 flex-shrink-0">Live Threat Feed</h3>
                        <div className="overflow-y-auto pr-2 flex-1">
                            {threats.map(threat => (
                                <div key={threat.id} onClick={() => setSelectedThreat(threat)} className="text-xs py-1.5 border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-500 flex justify-between items-center cursor-pointer hover:bg-white/5 px-1 rounded">
                                    <div><span className="text-rose-400 font-bold mr-2">{threat.type}</span><span className="text-slate-400">from {threat.sourceCountry}</span></div>
                                    <div className="font-bold text-[10px]">{statusDisplay[threat.status]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-slate-300 mb-2">Threats by Type</h3>
                        <div className="h-24"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} /><Bar dataKey="count" fill="#ef4444" background={{ fill: 'rgba(255,255,255,0.05)' }} barSize={10}><LabelList dataKey="count" position="right" fill="#94a3b8" fontSize={10} /></Bar></BarChart></ResponsiveContainer></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
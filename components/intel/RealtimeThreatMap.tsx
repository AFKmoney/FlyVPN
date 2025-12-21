import React, { useState, useEffect, useMemo, useRef, useReducer } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell, LineChart, Line, Tooltip, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- INTEL CONFIGURATION ---

// 1. Global Cyber Threats (WAN)
const CYBER_THREATS = ['Phishing', 'Malware', 'DDoS', 'Spyware', 'Adware', 'Ransomware', 'Botnet Activity'];

// 2. Hyper-Local RF Threats (LAN/Physical)
const RF_THREATS: Record<string, { min: number, max: number, unit: string, band: string, type: string }> = {
    'VHF/UHF Intercept': { min: 30, max: 1000, unit: 'MHz', band: 'VHF/UHF', type: 'Local Radio Interception' },
    'L-Band Surveillance': { min: 1.0, max: 2.0, unit: 'GHz', band: 'L-Band', type: 'Long Range Radar' },
    'S-Band Radar': { min: 2.0, max: 4.0, unit: 'GHz', band: 'S-Band', type: 'Weather/Airport Radar' },
    'C-Band Radar': { min: 4.0, max: 8.0, unit: 'GHz', band: 'C-Band', type: 'Satellite Uplink' },
    'X-Band Radar': { min: 8.0, max: 12.0, unit: 'GHz', band: 'X-Band', type: 'Precision Targeting' }, 
    'Directed Microwave': { min: 10.0, max: 40.0, unit: 'GHz', band: 'mmWave', type: 'Directed Energy' },
    'WiFi-Band Extraction': { min: 2.4, max: 5.9, unit: 'GHz', band: 'ISM', type: 'Network Sniffing' },
    'Ultrasonic Sensor': { min: 20, max: 100, unit: 'kHz', band: 'Acoustic', type: 'Audio Surveillance' },
};

const RF_THREAT_KEYS = Object.keys(RF_THREATS);

// Active Defense Protocols
const COUNTER_MEASURES_CYBER = [
    "Injecting TCP RST Packet",
    "Sending HTTP 500 Fake Error",
    "Flooding Handshake with Garbage",
    "Corrupting Payload Header",
    "Spoofing 'Connection Refused'"
];

const COUNTER_MEASURES_RF = [
    "Broadcasting White Noise Error",
    "Frequency Hopping Initiated",
    "Phase Cancellation Pulse",
    "Generating Phantom Signal",
    "Emitting Jamming Wave"
];

const COUNTRIES: Record<string, { lat: number, lon: number, ipPrefix: string }> = { "Russia": { lat: 61.5240, lon: 105.3188, ipPrefix: '91.192' }, "China": { lat: 35.8617, lon: 104.1954, ipPrefix: '113.88' }, "North Korea": { lat: 40.3399, lon: 127.5101, ipPrefix: '175.45' }, "Iran": { lat: 32.4279, lon: 53.6880, ipPrefix: '80.75' }, "Brazil": { lat: -14.2350, lon: -51.9253, ipPrefix: '189.1' }, "Nigeria": { lat: 9.0820, lon: 8.6753, ipPrefix: '105.112' }, "United States": { lat: 38.0, lon: -97.0, ipPrefix: '68.180' }, "Germany": { lat: 51.0, lon: 9.0, ipPrefix: '84.116' }, "India": { lat: 20.5937, lon: 78.9629, ipPrefix: '115.96' }, "Vietnam": { lat: 14.0583, lon: 108.2772, ipPrefix: '113.160' }};
const COUNTRY_KEYS = Object.keys(COUNTRIES);

type ThreatStatus = 'detecting' | 'locking' | 'neutralizing' | 'neutralized';

interface Threat { 
    id: number; 
    category: 'CYBER' | 'RF';
    type: string; 
    
    // Cyber specific
    sourceCountry?: string; 
    ip?: string; 
    
    // RF specific
    frequency?: string;
    signalBand?: string;
    powerLevel?: string; // dBm
    distance?: string;
    subType?: string;
    wavelength?: string;
    
    // Common
    coords: { lat: number, lon: number }; 
    timestamp: number; 
    status: ThreatStatus; 
    counterMeasure?: string;
}

type AnimationLine = { id: number; positions: [number, number][]; color: string; type: 'attack' | 'defense' };

// --- Intelligence Engines ---

const generateRandomFreq = (min: number, max: number, precision: number) => {
    return (Math.random() * (max - min) + min).toFixed(precision);
};

// Generates a coordinate very close to the user (simulating local surveillance)
const getOffsetLocation = (base: {lat: number, lon: number}) => {
    // 0.0001 degrees is roughly 11 meters. 
    // We want threats within ~50-500 meters.
    const latOffset = (Math.random() - 0.5) * 0.008; 
    const lonOffset = (Math.random() - 0.5) * 0.008;
    return { lat: base.lat + latOffset, lon: base.lon + lonOffset };
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
};

const calculateWavelength = (freqVal: number, unit: string) => {
    // c = f * lambda => lambda = c / f
    const c = 3e8;
    let hz = freqVal;
    if (unit === 'kHz') hz *= 1e3;
    if (unit === 'MHz') hz *= 1e6;
    if (unit === 'GHz') hz *= 1e9;
    const lambda = c / hz;
    if (lambda < 0.01) return (lambda * 1000).toFixed(2) + " mm";
    if (lambda < 1) return (lambda * 100).toFixed(2) + " cm";
    return lambda.toFixed(2) + " m";
}

// Audio System
const playAlertSound = (type: 'CYBER' | 'RF' | 'LOCK') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'RF') {
            // Sonar ping
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);
        } else if (type === 'LOCK') {
            // Aggressive lock sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.15);
        } else {
            // Digital glitch
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {
        // Audio might be blocked by browser
    }
};

const userIcon = new L.DivIcon({
    html: `<div class="user-location-pulse"></div>`,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const rfIcon = new L.DivIcon({
    html: `<div class="relative w-4 h-4">
            <div class="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>
            <div class="absolute inset-0 bg-purple-500 rounded-full border-2 border-white shadow-[0_0_15px_#a855f7]"></div>
           </div>`,
    className: 'rf-threat-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// --- State Management ---
type MapState = {
  threats: Threat[];
  threatStats: Record<string, number>;
  activeLines: AnimationLine[];
  intensityHistory: { time: string, count: number }[];
};

type MapAction =
  | { type: 'ADD_THREAT'; payload: { threat: Threat; line?: AnimationLine } }
  | { type: 'UPDATE_STATUS'; payload: { threatId: number; status: ThreatStatus } }
  | { type: 'ADD_DEFENSE_LINE'; payload: { line: AnimationLine } }
  | { type: 'FINISH_NEUTRALIZE'; payload: { threatId: number; counterMeasure: string } }
  | { type: 'CLEAR_LINE'; payload: number }
  | { type: 'TICK_HISTORY'; payload: null };

const initialState: MapState = {
  threats: [],
  threatStats: {},
  activeLines: [],
  intensityHistory: Array.from({length: 20}, (_, i) => ({ time: i.toString(), count: 0 }))
};

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'ADD_THREAT': {
      const { threat, line } = action.payload;
      const newLines = line ? [...state.activeLines, line] : state.activeLines;
      return {
        ...state,
        threats: [threat, ...state.threats].slice(0, 100),
        threatStats: { ...state.threatStats, [threat.type]: (state.threatStats[threat.type] || 0) + 1 },
        activeLines: newLines
      };
    }
    case 'UPDATE_STATUS': {
        return {
            ...state,
            threats: state.threats.map(t => t.id === action.payload.threatId ? { ...t, status: action.payload.status } : t),
        };
    }
    case 'ADD_DEFENSE_LINE': {
        return {
            ...state,
            activeLines: [...state.activeLines, action.payload.line]
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
    case 'TICK_HISTORY':
        const activeCount = state.threats.filter(t => t.status === 'detecting' || t.status === 'locking').length;
        const newHistory = [...state.intensityHistory.slice(1), { time: new Date().toLocaleTimeString(), count: activeCount }];
        return { ...state, intensityHistory: newHistory };
    default:
      return state;
  }
};

const RecenterMap = ({ center }: { center: { lat: number; lon: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lon], map.getZoom());
        }
    }, [center, map]);
    return null;
};

const ThreatDossier = ({ threat, onClose }: { threat: Threat, onClose: () => void }) => (
    <div className="absolute top-0 right-0 h-full w-96 glass p-0 z-[1000] flex flex-col animate-in slide-in-from-right-4 duration-300 border-l border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
            <h3 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${threat.category === 'RF' ? 'text-purple-400' : 'text-rose-400'}`}>
                {threat.category === 'RF' ? 'SIGNAL INTERCEPT' : 'CYBER THREAT'}
            </h3>
            <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Primary Info Card */}
            <div className={`p-4 rounded-lg border ${threat.category === 'RF' ? 'bg-purple-900/20 border-purple-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
                <div className="text-slate-400 font-bold uppercase text-[10px] mb-1">Signature Detected</div>
                <div className="font-black text-slate-100 text-xl leading-tight">{threat.type}</div>
                {threat.subType && <div className="text-xs text-slate-300 mt-1">{threat.subType}</div>}
            </div>

            {/* Spectrum Analysis for RF */}
            {threat.category === 'RF' && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-slate-700 flex-1"></div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">Spectrum Analysis</span>
                        <div className="h-px bg-slate-700 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-purple-400 font-bold uppercase text-[9px]">Frequency</div>
                            <div className="font-mono text-sm text-white">{threat.frequency}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-purple-400 font-bold uppercase text-[9px]">Band</div>
                            <div className="font-mono text-sm text-white">{threat.signalBand}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-purple-400 font-bold uppercase text-[9px]">Signal Strength</div>
                            <div className="font-mono text-sm text-white">{threat.powerLevel}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-purple-400 font-bold uppercase text-[9px]">Wavelength</div>
                            <div className="font-mono text-sm text-white">{threat.wavelength}</div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-2 rounded border border-white/5 mt-2">
                         <div className="flex justify-between text-[9px] uppercase text-slate-500 font-bold mb-1">
                            <span>Waveform Confidence</span>
                            <span>99.9%</span>
                        </div>
                        <div className="w-full h-8 flex items-end gap-0.5 opacity-80">
                            {[40, 60, 30, 80, 50, 90, 20, 40, 60, 80, 50, 70, 30, 60, 90, 50, 30, 60, 40, 70].map((h, i) => (
                                <div key={i} style={{height: `${h}%`}} className="flex-1 bg-purple-500 rounded-sm"></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Network Info for Cyber */}
            {threat.category === 'CYBER' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-slate-500 font-bold uppercase text-[10px]">Source Origin</div>
                            <div className="font-semibold text-slate-200">{threat.sourceCountry}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                            <div className="text-slate-500 font-bold uppercase text-[10px]">Threat Level</div>
                            <div className="font-bold text-rose-500 animate-pulse">CRITICAL</div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                        <div className="text-slate-500 font-bold uppercase text-[10px]">Targeted IP</div>
                        <div className="mono text-slate-300 bg-slate-900/50 px-2 py-1 rounded inline-block border border-white/5 text-xs">{threat.ip}</div>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-white/10 mt-2">
                <div className="text-slate-500 font-bold uppercase text-[10px] mb-2">Defense Status</div>
                {threat.status === 'neutralized' 
                    ? <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded text-emerald-400 flex flex-col gap-1 animate-in zoom-in duration-300">
                        <div className="font-bold flex items-center gap-2"><span className="text-lg">✓</span> THREAT NEUTRALIZED</div>
                        <div className="text-[10px] uppercase tracking-wider text-emerald-300/70">Data Secure</div>
                      </div>
                    : <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded text-amber-400 flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {threat.status === 'detecting' ? 'ACQUIRING TARGET...' : 'ENGAGING COUNTERMEASURE...'}
                      </div>
                }
            </div>

            {threat.counterMeasure && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-4">
                    <div className="text-slate-500 font-bold uppercase text-[10px] mb-1">Countermeasure Payload</div>
                    <div className={`font-mono text-xs p-3 rounded border bg-slate-950 shadow-inner ${threat.category === 'RF' ? 'border-purple-500/20 text-purple-300' : 'border-cyan-500/20 text-cyan-300'}`}>
                        <div className="opacity-50 text-[9px] mb-1">>> TRANSMITTING ERROR PACKET...</div>
                        <div className="font-bold">{`> ${threat.counterMeasure}`}</div>
                        <div className="text-emerald-500 mt-1">>> SENT OK</div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 italic">
                        * Real data protected. Error message sent to attacker.
                    </p>
                </div>
            )}
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
    const { threats, threatStats, activeLines, intensityHistory } = state;
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            // Priority: RF threats if user location is known (High Tech feel)
            const isRF = userLocation && Math.random() < 0.6;
            let newThreat: Threat;
            let line: AnimationLine | undefined;

            if (isRF && userLocation) {
                // Generate RF Threat near user
                const threatTypeKey = RF_THREAT_KEYS[Math.floor(Math.random() * RF_THREAT_KEYS.length)];
                const config = RF_THREATS[threatTypeKey];
                const coords = getOffsetLocation(userLocation);
                const distance = calculateDistance(userLocation.lat, userLocation.lon, coords.lat, coords.lon);
                
                // Frequency logic
                const freqVal = parseFloat(generateRandomFreq(config.min, config.max, 3));
                const freq = freqVal + ' ' + config.unit;
                
                newThreat = {
                    id: Date.now() + Math.random(),
                    category: 'RF',
                    type: threatTypeKey,
                    subType: config.type,
                    frequency: freq,
                    signalBand: config.band,
                    powerLevel: `-${Math.floor(Math.random() * 50 + 40)} dBm`,
                    distance: `${distance}m`,
                    wavelength: calculateWavelength(freqVal, config.unit),
                    coords: coords,
                    timestamp: Date.now(),
                    status: 'detecting'
                };
                
                playAlertSound('RF');

            } else {
                // Generate Cyber Threat from world
                const countryName = COUNTRY_KEYS[Math.floor(Math.random() * COUNTRY_KEYS.length)];
                const countryData = COUNTRIES[countryName];
                const threatType = CYBER_THREATS[Math.floor(Math.random() * CYBER_THREATS.length)];
                
                const generateIP = (prefix: string) => `${prefix}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

                newThreat = { 
                    id: Date.now() + Math.random(), 
                    category: 'CYBER',
                    type: threatType, 
                    sourceCountry: countryName, 
                    coords: countryData, 
                    ip: generateIP(countryData.ipPrefix), 
                    timestamp: Date.now(), 
                    status: 'detecting' 
                };

                if (userLocation) {
                    line = { 
                        id: newThreat.id, 
                        positions: [[countryData.lat, countryData.lon], [userLocation.lat, userLocation.lon]], 
                        color: '#ef4444',
                        type: 'attack'
                    };
                }
                playAlertSound('CYBER');
            }

            dispatch({ type: 'ADD_THREAT', payload: { threat: newThreat, line } });

            if (line) {
                setTimeout(() => dispatch({ type: 'CLEAR_LINE', payload: newThreat.id }), 1000);
            }

            // --- AUTO-NEUTRALIZE SEQUENCE (The "Real" Defense) ---
            setTimeout(() => {
                dispatch({ type: 'UPDATE_STATUS', payload: { threatId: newThreat.id, status: 'locking' } });
                playAlertSound('LOCK');
                
                // Defense animation
                let neutralizeLine: AnimationLine | undefined;
                if (userLocation) {
                    neutralizeLine = { 
                        id: newThreat.id + 10000, 
                        positions: [[userLocation.lat, userLocation.lon], [newThreat.coords.lat, newThreat.coords.lon]], 
                        color: newThreat.category === 'RF' ? '#a855f7' : '#22d3ee', // Purple for RF defense, Cyan for Cyber
                        type: 'defense'
                    };
                    dispatch({ type: 'ADD_DEFENSE_LINE', payload: { line: neutralizeLine }});
                }

                setTimeout(() => {
                    const measures = newThreat.category === 'RF' ? COUNTER_MEASURES_RF : COUNTER_MEASURES_CYBER;
                    const counterMeasure = measures[Math.floor(Math.random() * measures.length)];
                    
                    dispatch({ type: 'FINISH_NEUTRALIZE', payload: { threatId: newThreat.id, counterMeasure } });
                    onNeutralize?.(newThreat.type);
                    
                    if (selectedThreat?.id === newThreat.id) {
                        setSelectedThreat(t => t && ({...t, status: 'neutralized', counterMeasure}));
                    }
                }, 800);

            }, 1000);

        }, 3500); // Scans every 3.5s

        return () => clearInterval(interval);
    }, [onNeutralize, userLocation, selectedThreat?.id]);

    useEffect(() => {
        const histInterval = setInterval(() => {
            dispatch({ type: 'TICK_HISTORY', payload: null });
        }, 2000);
        return () => clearInterval(histInterval);
    }, []);

    const handleToggleFullscreen = () => {
        if (!modalRef.current) return;
        if (!document.fullscreenElement) {
            modalRef.current.requestFullscreen().catch(err => console.error(err));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const chartData = useMemo(() => {
        // Merge stats
        const allStats = {...threatStats};
        // Ensure keys exist for chart even if 0
        [...CYBER_THREATS, ...RF_THREAT_KEYS].forEach(k => { if (!allStats[k]) allStats[k] = 0; });
        return Object.entries(allStats)
            .map(([name, count]) => ({ name, count }))
            .sort((a,b) => (b.count as number) - (a.count as number))
            .slice(0, 10);
    }, [threatStats]);

    const statusDisplay: Record<ThreatStatus, React.ReactElement> = { 
        detecting: <span className="text-amber-400">DETECTING</span>, 
        locking: <span className="text-rose-400 animate-pulse">LOCKING</span>,
        neutralizing: <span className="text-cyan-400 animate-pulse">JAMMING</span>, 
        neutralized: <span className="text-slate-500">NEUTRALIZED</span> 
    };

    return (
        <div ref={modalRef} className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col z-50 animate-in fade-in duration-300 overflow-y-auto">
            {/* Header */}
            <div className="p-4 sm:p-6 pb-2 flex items-center justify-between flex-shrink-0 sticky top-0 bg-slate-900/90 z-20 backdrop-blur-md border-b border-white/5">
                <div>
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>
                        GLOBAL THREAT INTELLIGENCE
                    </h2>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Real-time Spectrum Analysis & Active Defense</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleToggleFullscreen} className="p-2 text-slate-400 hover:text-white glass rounded transition-colors hidden sm:block">
                        {isFullscreen ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H4v4m12 0V4h-4M8 20H4v-4m12 0v4h-4" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>}
                    </button>
                    <button onClick={onClose} className="text-3xl text-slate-400 hover:text-white transition-colors leading-none">&times;</button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 h-full">
                
                {/* TOP: Map */}
                <div className="h-[50vh] sm:h-[60vh] glass rounded-2xl p-0 relative overflow-hidden border-0 flex-shrink-0">
                    <MapContainer center={[20, 30]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} className="map-container bg-[#020617]">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'/>
                        <RecenterMap center={userLocation} />
                        {userLocation && (
                            <>
                                <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />
                                <CircleMarker center={[userLocation.lat, userLocation.lon]} radius={50} pathOptions={{ color: '#a855f7', weight: 1, fillOpacity: 0.05, dashArray: '5, 10' }}>
                                </CircleMarker>
                            </>
                        )}
                        {threats.filter(t => t.status !== 'neutralized').map(threat => (
                             threat.category === 'RF' ? (
                                <Marker 
                                    key={threat.id} 
                                    position={[threat.coords.lat, threat.coords.lon]} 
                                    icon={rfIcon}
                                    eventHandlers={{ click: () => setSelectedThreat(threat) }}
                                />
                             ) : (
                                <CircleMarker 
                                    key={threat.id} 
                                    center={[threat.coords.lat, threat.coords.lon]} 
                                    radius={4} 
                                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 }} 
                                    eventHandlers={{ click: () => setSelectedThreat(threat) }}
                                />
                             )
                        ))}
                        {activeLines.map(line => <Polyline key={line.id} positions={line.positions as any} color={line.color} weight={line.type === 'attack' ? 1.5 : 2.5} opacity={line.type === 'attack' ? 0.6 : 0.9} dashArray={line.type === 'attack' ? undefined : '5, 10'} />)}
                    </MapContainer>
                    <div className="absolute bottom-4 left-4 pointer-events-none">
                        <div className="glass px-3 py-1 rounded text-[10px] font-mono text-cyan-400 border-cyan-500/30">
                            LIVE FEED ACTIVE • <span className="text-white">SCANNING...</span>
                        </div>
                    </div>
                    {selectedThreat && <ThreatDossier threat={selectedThreat} onClose={() => setSelectedThreat(null)} />}
                </div>

                {/* BOTTOM: Detailed Analytics & Logs */}
                <div className="flex flex-col lg:flex-row gap-6 h-[400px] lg:h-[350px]">
                    
                    {/* Left: Detailed Log (Scrollable) */}
                    <div className="flex-[2] glass rounded-2xl p-0 flex flex-col min-h-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-900/30 backdrop-blur flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-300">Detailed Threat Log</h3>
                            <span className="text-[10px] text-slate-500 uppercase">Real-time Data</span>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Time</th>
                                        <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Type</th>
                                        <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Origin / Freq</th>
                                        <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                        <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {threats.map(threat => (
                                        <tr key={threat.id} onClick={() => setSelectedThreat(threat)} className="hover:bg-white/5 cursor-pointer transition-colors group">
                                            <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{new Date(threat.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-3">
                                                <span className={`font-bold ${threat.category === 'RF' ? 'text-purple-400' : 'text-rose-400'}`}>{threat.type}</span>
                                            </td>
                                            <td className="p-3 text-slate-300 font-mono">
                                                {threat.category === 'RF' ? threat.frequency : threat.sourceCountry}
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${threat.status === 'neutralized' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                                    {threat.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {threat.counterMeasure ? (
                                                    <span className="text-[9px] text-cyan-400 font-mono flex items-center justify-end gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                                        PAYLOAD SENT
                                                    </span>
                                                ) : <span className="text-[10px] text-slate-600">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Graphs */}
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        {/* Line Chart: Intensity History */}
                        <div className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Threat Intensity (Time)</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={intensityHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide domain={[0, 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                                            itemStyle={{ color: '#22d3ee' }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart: Spectrum */}
                        <div className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Threat Spectrum</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} width={70} />
                                        <Bar dataKey="count" fill="#3b82f6" background={{ fill: 'rgba(255,255,255,0.05)' }} barSize={6} radius={[0, 4, 4, 0]}>
                                            {
                                                chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={RF_THREAT_KEYS.includes(entry.name) ? '#a855f7' : '#ef4444'} />
                                                ))
                                            }
                                            <LabelList dataKey="count" position="right" fill="#94a3b8" fontSize={9} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

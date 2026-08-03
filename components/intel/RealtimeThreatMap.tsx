import React, { useState, useEffect, useMemo, useRef, useReducer, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell, LineChart, Line, Tooltip, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { defense } from '../../services/defenseService';
import { ThreatEvent, ThreatSeverity, DefenseRule, RuleAction, AuditEntry, ThreatCategory } from '../../services/defenseTypes';

// =============================================================================
//  CONFIGURATION
// =============================================================================

const SEVERITY_COLORS: Record<ThreatSeverity, string> = {
    low:      '#10b981',
    medium:   '#f59e0b',
    high:     '#f97316',
    critical: '#ef4444',
};

const CATEGORY_COLOR: Record<'CYBER' | 'RF', string> = {
    CYBER: '#ef4444',
    RF:    '#a855f7',
};

const ACTION_COLOR: Record<RuleAction, string> = {
    block:    '#ef4444',
    throttle: '#f59e0b',
    scrub:    '#3b82f6',
    jam:      '#a855f7',
    log:      '#64748b',
    redirect: '#06b6d4',
    alert:    '#facc15',
};

const CATEGORY_LIST: Array<{ id: 'CYBER' | 'RF'; label: string }> = [
    { id: 'CYBER', label: 'Cyber' },
    { id: 'RF',    label: 'RF / Spectrum' },
];

const SEVERITY_LIST: ThreatSeverity[] = ['low', 'medium', 'high', 'critical'];

const ACTION_LABELS: Record<RuleAction, string> = {
    block:    'Block',
    throttle: 'Throttle',
    scrub:    'Scrub',
    jam:      'Jam',
    log:      'Log',
    redirect: 'Sinkhole',
    alert:    'Alert',
};

// =============================================================================
//  STATE
// =============================================================================

interface MapState {
    threats: ThreatEvent[];
    activeLines: Array<{ id: number; positions: [number, number][]; color: string; type: 'attack' | 'defense' }>;
    intensityHistory: { time: string; count: number }[];
    selectedRule: DefenseRule | null;
}

type MapAction =
    | { type: 'ADD_THREAT'; payload: { threat: ThreatEvent; line?: MapState['activeLines'][number] } }
    | { type: 'UPDATE_THREAT'; payload: { id: number; patch: Partial<ThreatEvent> } }
    | { type: 'CLEAR_LINE'; payload: number }
    | { type: 'CLEAR' }
    | { type: 'TICK_HISTORY' }
    | { type: 'SELECT_RULE'; payload: DefenseRule | null };

const initialState: MapState = {
    threats: [],
    activeLines: [],
    intensityHistory: Array.from({length: 20}, (_, i) => ({ time: i.toString(), count: 0 })),
    selectedRule: null,
};

const mapReducer = (state: MapState, action: MapAction): MapState => {
    switch (action.type) {
        case 'ADD_THREAT': {
            const { threat, line } = action.payload;
            const exists = state.threats.some(t => t.id === threat.id);
            if (exists) {
                return {
                    ...state,
                    threats: state.threats.map(t => t.id === threat.id ? threat : t),
                    activeLines: line ? [...state.activeLines, line] : state.activeLines,
                };
            }
            return {
                ...state,
                threats: [threat, ...state.threats].slice(0, 200),
                activeLines: line ? [...state.activeLines, line] : state.activeLines,
            };
        }
        case 'UPDATE_THREAT':
            return {
                ...state,
                threats: state.threats.map(t => t.id === action.payload.id ? { ...t, ...action.payload.patch } : t),
            };
        case 'CLEAR_LINE':
            return { ...state, activeLines: state.activeLines.filter(l => l.id !== action.payload) };
        case 'CLEAR':
            return { ...state, threats: [], activeLines: [] };
        case 'TICK_HISTORY': {
            const activeCount = state.threats.filter(t => t.status === 'detecting' || t.status === 'locking' || t.status === 'neutralizing').length;
            return {
                ...state,
                intensityHistory: [...state.intensityHistory.slice(1), { time: new Date().toLocaleTimeString(), count: activeCount }],
            };
        }
        case 'SELECT_RULE':
            return { ...state, selectedRule: action.payload };
        default:
            return state;
    }
};

// =============================================================================
//  ANIMATION
// =============================================================================

const generateInterPath = (start: [number, number], end: [number, number]): [number, number][] => {
    const steps = 20;
    const path: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lon = start[1] + (end[1] - start[1]) * t;
        // Add slight arc
        const arc = Math.sin(t * Math.PI) * 0.5;
        path.push([lat + arc * (Math.random() - 0.5) * 0.1, lon + arc * (Math.random() - 0.5) * 0.1]);
    }
    return path;
};

// =============================================================================
//  LEAFLET ICONS
// =============================================================================

const userIcon = new L.DivIcon({
    html: `<div class="user-location-pulse"></div>`,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const threatIcon = (severity: ThreatSeverity, status: string): L.DivIcon => {
    const color = SEVERITY_COLORS[severity];
    const ring = status === 'neutralized' ? 'opacity-40' : status === 'neutralizing' ? 'animate-ping' : 'animate-pulse';
    return new L.DivIcon({
        html: `<div class="relative w-5 h-5">
                <div class="absolute inset-0 ${ring} rounded-full opacity-50" style="background:${color}"></div>
                <div class="absolute inset-1 rounded-full border-2 border-white shadow-[0_0_15px_${color}]" style="background:${color}"></div>
               </div>`,
        className: 'threat-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

// =============================================================================
//  RECENTER HELPER
// =============================================================================

const RecenterMap = ({ center }: { center: { lat: number; lon: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo([center.lat, center.lon], map.getZoom(), { animate: true, duration: 0.6 });
    }, [center, map]);
    return null;
};

// =============================================================================
//  COMPONENT
// =============================================================================

interface RealtimeThreatMapProps {
    onClose: () => void;
    onNeutralize?: (type: string) => void;
    userLocation: { lat: number; lon: number } | null;
}

export const RealtimeThreatMap: React.FC<RealtimeThreatMapProps> = ({ onClose, onNeutralize, userLocation }) => {
    const [state, dispatch] = useReducer(mapReducer, initialState);
    const { threats, activeLines, intensityHistory, selectedRule } = state;
    const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);

    // Filters & controls
    const [filterCategory, setFilterCategory] = useState<'all' | 'CYBER' | 'RF'>('all');
    const [filterSeverity, setFilterSeverity] = useState<ThreatSeverity | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'active' | 'all' | 'neutralized'>('active');
    const [search, setSearch] = useState('');
    const [autoNeutralize, setAutoNeutralize] = useState(true);
    const [paused, setPaused] = useState(false);
    const [rules, setRules] = useState<DefenseRule[]>(defense.getRules());
    const [showRules, setShowRules] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(defense.getAudit());
    const [recentFeed, setRecentFeed] = useState<{ asn: string; name: string; cc: string; events: number; reputation: number }[]>([]);
    const [showFeed, setShowFeed] = useState(true);
    const [stats, setStats] = useState(defense.getStats());
    const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(userLocation);
    const [zoomToThreat, setZoomToThreat] = useState<number | null>(null);

    // Wire up the defense system
    useEffect(() => {
        defense.start();
        const offThreat = defense.onThreat((ev) => {
            if (paused) return;
            // Animation line from origin to user
            if (userLocation) {
                const line = {
                    id: ev.id,
                    positions: generateInterPath([ev.coords.lat, ev.coords.lon], [userLocation.lat, userLocation.lon]),
                    color: CATEGORY_COLOR[ev.category],
                    type: 'attack' as const,
                };
                dispatch({ type: 'ADD_THREAT', payload: { threat: ev, line } });
                // Clear the line after a short delay
                setTimeout(() => dispatch({ type: 'CLEAR_LINE', payload: ev.id }), 4000);
            } else {
                dispatch({ type: 'ADD_THREAT', payload: { threat: ev } });
            }
        });
        const offRules = defense.onRules(setRules);
        const offAudit = defense.onAudit((entry) => setAuditEntries(prev => [...prev, entry].slice(-500)));
        const offStats = defense.onStats(setStats);
        const offFeed = defense.onFeed((feed) => setRecentFeed(feed.sources));
        const histTimer = window.setInterval(() => dispatch({ type: 'TICK_HISTORY' }), 2000);

        return () => {
            offThreat();
            offRules();
            offAudit();
            offStats();
            histTimer && clearInterval(histTimer);
        };
    }, [userLocation, paused]);

    // Filtered view
    const visibleThreats = useMemo(() => {
        const q = search.trim().toLowerCase();
        return threats.filter(t => {
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (filterSeverity !== 'all' && t.severity !== filterSeverity) return false;
            if (filterStatus === 'active' && (t.status === 'neutralized' || t.status === 'failed')) return false;
            if (filterStatus === 'neutralized' && t.status !== 'neutralized') return false;
            if (q) {
                const hay = `${t.type} ${t.subType ?? ''} ${t.cyber?.sourceCountry ?? ''} ${t.cyber?.sourceIp ?? ''} ${t.cyber?.domain ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [threats, filterCategory, filterSeverity, filterStatus, search]);

    const threatCounts = useMemo(() => {
        const bySeverity: Record<ThreatSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const t of visibleThreats) bySeverity[t.severity] += 1;
        return bySeverity;
    }, [visibleThreats]);

    const threatStats = useMemo(() => {
        const map: Record<string, number> = {};
        for (const t of visibleThreats) map[t.type] = (map[t.type] || 0) + 1;
        return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [visibleThreats]);

    // Auto-neutralize toggle
    useEffect(() => {
        defense.setPaused(paused);
    }, [paused]);

    // Handlers
    const handleNeutralize = useCallback((t: ThreatEvent) => {
        defense.neutralize(t.id, 'block');
        if (onNeutralize) onNeutralize(t.type);
    }, [onNeutralize]);

    const handleBlockDomain = useCallback((domain: string) => {
        defense.blockDomain(domain);
    }, []);

    const handleClear = useCallback(() => {
        dispatch({ type: 'CLEAR' });
    }, []);

    const handleToggleRule = useCallback((id: string) => {
        defense.toggleRule(id);
    }, []);

    const handleThreatClick = useCallback((t: ThreatEvent) => {
        setSelectedThreat(t);
        setMapCenter(t.coords);
        setZoomToThreat(t.id);
    }, []);

    return (
        <div className={`fixed inset-0 bg-slate-950/95 z-50 flex flex-col ${selectedThreat ? '' : ''}`}>
            {/* ===== Header / Toolbar ===== */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 glass">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/40 flex items-center justify-center">
                        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.7 17.3l.426 1.422a2 2 0 001.97 1.423h2.798a2 2 0 001.97-1.423l.426-1.422M6 11V3a3 3 0 013-3h6a3 3 0 013 3v8" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">Live Threat Operations Center</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{visibleThreats.length} visible · {stats.total} total · {stats.neutralized} neutralized</p>
                    </div>
                </div>

                {/* Center filters */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search threats, IPs, countries…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                    <div className="flex items-center glass rounded-lg p-0.5">
                        <button onClick={() => setFilterCategory('all')}   className={`px-2 py-1 text-[10px] font-bold rounded ${filterCategory === 'all'   ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>All</button>
                        <button onClick={() => setFilterCategory('CYBER')} className={`px-2 py-1 text-[10px] font-bold rounded ${filterCategory === 'CYBER' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'}`}>Cyber</button>
                        <button onClick={() => setFilterCategory('RF')}    className={`px-2 py-1 text-[10px] font-bold rounded ${filterCategory === 'RF'    ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400'}`}>RF</button>
                    </div>
                    <div className="flex items-center glass rounded-lg p-0.5">
                        <button onClick={() => setFilterSeverity('all')}     className={`px-2 py-1 text-[10px] font-bold rounded ${filterSeverity === 'all'     ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Any</button>
                        {SEVERITY_LIST.map(s => (
                            <button key={s} onClick={() => setFilterSeverity(s)} className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${filterSeverity === s ? 'text-white' : 'text-slate-400'}`} style={filterSeverity === s ? { background: SEVERITY_COLORS[s] } : {}}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center glass rounded-lg p-0.5">
                        <button onClick={() => setFilterStatus('active')}      className={`px-2 py-1 text-[10px] font-bold rounded ${filterStatus === 'active'      ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Active</button>
                        <button onClick={() => setFilterStatus('all')}         className={`px-2 py-1 text-[10px] font-bold rounded ${filterStatus === 'all'         ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>All</button>
                        <button onClick={() => setFilterStatus('neutralized')}className={`px-2 py-1 text-[10px] font-bold rounded ${filterStatus === 'neutralized'? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Done</button>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setPaused(p => !p)} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border ${paused ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'}`}>
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button onClick={() => setShowRules(s => !s)} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border ${showRules ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'border-white/10 text-slate-400'}`}>
                        Rules ({rules.filter(r => r.enabled).length})
                    </button>
                    <button onClick={() => setShowFeed(f => !f)} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border ${showFeed ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'border-white/10 text-slate-400'}`}>
                        Feed
                    </button>
                    <button onClick={() => setShowAudit(a => !a)} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border ${showAudit ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'border-white/10 text-slate-400'}`}>
                        Audit
                    </button>
                    <button onClick={handleClear} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border border-white/10 text-slate-400 hover:text-rose-400">
                        Clear
                    </button>
                    <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* ===== Body ===== */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={[userLocation?.lat ?? 30, userLocation?.lon ?? 0]}
                        zoom={2}
                        minZoom={2}
                        maxZoom={12}
                        scrollWheelZoom
                        className="w-full h-full"
                        worldCopyJump
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; OpenStreetMap &copy; CARTO'
                        />
                        {userLocation && <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />}
                        <RecenterMap center={mapCenter} />
                        {activeLines.map(line => (
                            <Polyline key={line.id} positions={line.positions} pathOptions={{ color: line.color, weight: 1.5, opacity: 0.6, dashArray: '4,6' }} />
                        ))}
                        {visibleThreats.map(threat => (
                            <React.Fragment key={threat.id}>
                                <CircleMarker
                                    center={[threat.coords.lat, threat.coords.lon]}
                                    radius={threat.severity === 'critical' ? 18 : threat.severity === 'high' ? 14 : 10}
                                    pathOptions={{
                                        color: SEVERITY_COLORS[threat.severity],
                                        fillColor: SEVERITY_COLORS[threat.severity],
                                        fillOpacity: 0.15,
                                        weight: 1.5,
                                    }}
                                    eventHandlers={{ click: () => handleThreatClick(threat) }}
                                />
                                <Marker
                                    position={[threat.coords.lat, threat.coords.lon]}
                                    icon={threatIcon(threat.severity, threat.status)}
                                    eventHandlers={{ click: () => handleThreatClick(threat) }}
                                />
                            </React.Fragment>
                        ))}
                    </MapContainer>

                    {/* Stats overlay (top-left) */}
                    <div className="absolute top-4 left-4 glass rounded-2xl p-4 w-72 pointer-events-none z-[400]">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Defense Status</div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <Stat label="Total"      value={stats.total} color="text-slate-200" />
                            <Stat label="Neutralized"value={stats.neutralized} color="text-emerald-400" />
                            <Stat label="Rate/min"   value={stats.recentRate} color="text-amber-400" />
                            <Stat label="Uptime"     value={formatUptime(stats.uptimeMs)} color="text-cyan-400" />
                        </div>
                        <div className="space-y-1.5">
                            {SEVERITY_LIST.map(s => (
                                <div key={s} className="flex items-center gap-2 text-[10px]">
                                    <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[s] }}></span>
                                    <span className="uppercase font-bold text-slate-300 w-16">{s}</span>
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full transition-all" style={{ width: `${Math.min(100, threatCounts[s] * 12)}%`, background: SEVERITY_COLORS[s] }}></div>
                                    </div>
                                    <span className="mono text-slate-400 w-8 text-right">{threatCounts[s]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Intensity (last 40s)</div>
                            <div className="h-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={intensityHistory}>
                                        <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Threat feed (bottom-left) */}
                    {showFeed && (
                        <div className="absolute bottom-4 left-4 glass rounded-2xl p-3 w-80 max-h-64 overflow-y-auto z-[400]">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live Threat Feed</div>
                            <div className="space-y-1.5">
                                {visibleThreats.slice(0, 12).map(t => (
                                    <button key={t.id} onClick={() => handleThreatClick(t)} className="w-full text-left flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[t.severity] }}></span>
                                        <span className="text-[11px] font-semibold text-slate-200 truncate flex-1">{t.type}{t.subType ? ` · ${t.subType}` : ''}</span>
                                        <span className="text-[9px] mono text-slate-500 uppercase">{t.status === 'neutralized' ? '✓' : t.status === 'detecting' ? '◌' : t.status === 'locking' ? '⌖' : '⚡'}</span>
                                    </button>
                                ))}
                                {visibleThreats.length === 0 && <div className="text-[10px] text-slate-500 italic text-center py-4">No threats match the current filters.</div>}
                            </div>
                        </div>
                    )}

                    {/* Discovery feed (top-right) */}
                    <div className="absolute top-4 right-4 glass rounded-2xl p-3 w-72 z-[400]">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Adversary ASN Watch</div>
                            <div className="text-[9px] mono text-slate-500">{recentFeed.length} sources</div>
                        </div>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {recentFeed.slice(0, 8).map(src => (
                                <div key={src.asn} className="flex items-center gap-2 text-[10px]">
                                    <span className="font-mono text-slate-500 w-16">{src.asn}</span>
                                    <span className="text-slate-300 flex-1 truncate">{src.name}</span>
                                    <span className="mono text-slate-400">{src.events}</span>
                                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${src.reputation * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Type breakdown (bottom-right) */}
                    {threatStats.length > 0 && (
                        <div className="absolute bottom-4 right-4 glass rounded-2xl p-3 w-72 z-[400]">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Threat Types</div>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={threatStats} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                                            cursor={{ fill: 'rgba(34,211,238,0.1)' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                            {threatStats.map((entry, idx) => (
                                                <Cell key={idx} fill="#22d3ee" />
                                            ))}
                                            <LabelList dataKey="count" position="right" fill="#cbd5e1" fontSize={10} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side panel */}
                {showRules && (
                    <RulesPanel rules={rules} onToggle={handleToggleRule} onClose={() => setShowRules(false)} />
                )}
                {showAudit && (
                    <AuditPanel entries={auditEntries} onClose={() => setShowAudit(false)} />
                )}
                {selectedThreat && (
                    <ThreatDossier
                        threat={selectedThreat}
                        onClose={() => setSelectedThreat(null)}
                        onNeutralize={() => { handleNeutralize(selectedThreat); setSelectedThreat({ ...selectedThreat, status: 'neutralizing' }); }}
                        onBlockDomain={(d) => handleBlockDomain(d)}
                    />
                )}
            </div>
        </div>
    );
};

// =============================================================================
//  SUB-COMPONENTS
// =============================================================================

const Stat: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => (
    <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{label}</div>
        <div className={`text-sm font-black mono ${color}`}>{value}</div>
    </div>
);

const formatUptime = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h${m % 60}m`;
};

// =============================================================================
//  RULES PANEL
// =============================================================================

const RulesPanel: React.FC<{ rules: DefenseRule[]; onToggle: (id: string) => void; onClose: () => void }> = ({ rules, onToggle, onClose }) => {
    const grouped = useMemo(() => {
        const sys = rules.filter(r => r.source === 'system');
        const usr = rules.filter(r => r.source === 'user');
        return { sys, usr };
    }, [rules]);

    return (
        <div className="w-96 border-l border-white/10 glass flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                    <h3 className="font-bold uppercase text-sm text-cyan-400 tracking-wider">Defense Rules</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Continuous policy engine</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">System Rules</div>
                    <div className="space-y-1.5">
                        {grouped.sys.map(r => <RuleRow key={r.id} rule={r} onToggle={onToggle} />)}
                    </div>
                </div>
                {grouped.usr.length > 0 && (
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">User Rules</div>
                        <div className="space-y-1.5">
                            {grouped.usr.map(r => <RuleRow key={r.id} rule={r} onToggle={onToggle} />)}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => defense.resetRules()}
                    className="w-full mt-2 py-2 text-[10px] uppercase font-bold rounded-lg border border-white/10 text-slate-400 hover:bg-slate-800"
                >
                    ↻ Reset to Defaults
                </button>
            </div>
        </div>
    );
};

const RuleRow: React.FC<{ rule: DefenseRule; onToggle: (id: string) => void }> = ({ rule, onToggle }) => {
    return (
        <div className={`p-2.5 rounded-lg border transition-all ${rule.enabled ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 bg-slate-900/40 opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate-200 truncate">{rule.name}</div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: `${CATEGORY_COLOR[rule.category as 'CYBER' | 'RF'] || '#64748b'}30`, color: CATEGORY_COLOR[rule.category as 'CYBER' | 'RF'] || '#94a3b8' }}>{rule.category}</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: `${SEVERITY_COLORS[rule.severity]}30`, color: SEVERITY_COLORS[rule.severity] }}>{rule.severity}+</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: `${ACTION_COLOR[rule.action]}30`, color: ACTION_COLOR[rule.action] }}>{ACTION_LABELS[rule.action]}</span>
                    </div>
                </div>
                <button
                    onClick={() => onToggle(rule.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                    <span className={`${rule.enabled ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                </button>
            </div>
        </div>
    );
};

// =============================================================================
//  AUDIT PANEL
// =============================================================================

const AuditPanel: React.FC<{ entries: AuditEntry[]; onClose: () => void }> = ({ entries, onClose }) => {
    const reversed = useMemo(() => [...entries].reverse().slice(0, 200), [entries]);
    return (
        <div className="w-96 border-l border-white/10 glass flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                    <h3 className="font-bold uppercase text-sm text-cyan-400 tracking-wider">Audit Log</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{entries.length} entries</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 mono text-[10px]">
                {reversed.map(e => (
                    <div key={e.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-white/5">
                        <span className="text-slate-500 shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
                        <span className={`shrink-0 uppercase font-bold ${e.actor === 'user' ? 'text-cyan-400' : e.actor === 'auto' ? 'text-emerald-400' : 'text-amber-400'}`}>{e.actor}</span>
                        <span className="text-slate-300 flex-1 break-all">{e.event}: {e.details}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =============================================================================
//  THREAT DOSSIER
// =============================================================================

const ThreatDossier: React.FC<{
    threat: ThreatEvent;
    onClose: () => void;
    onNeutralize: () => void;
    onBlockDomain: (domain: string) => void;
}> = ({ threat, onClose, onNeutralize, onBlockDomain }) => {
    return (
        <div className="w-96 border-l border-white/10 glass flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                    <h3 className="font-bold uppercase text-sm tracking-wider" style={{ color: CATEGORY_COLOR[threat.category] }}>
                        {threat.category === 'RF' ? 'Signal Intercept' : 'Cyber Threat'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 mono">ID #{threat.id}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Header */}
                <div className="p-3 rounded-lg border" style={{ background: `${SEVERITY_COLORS[threat.severity]}15`, borderColor: `${SEVERITY_COLORS[threat.severity]}50` }}>
                    <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Signature</div>
                    <div className="font-black text-slate-100 text-lg leading-tight">{threat.type}</div>
                    {threat.subType && <div className="text-xs text-slate-300 mt-1">{threat.subType}</div>}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: SEVERITY_COLORS[threat.severity], color: '#020617' }}>{threat.severity}</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: CATEGORY_COLOR[threat.category], color: '#020617' }}>{threat.category}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 mono">{threat.status}</span>
                    </div>
                </div>

                {/* Cyber info */}
                {threat.category === 'CYBER' && threat.cyber && (
                    <div className="space-y-1.5">
                        <KV label="Source IP"      value={threat.cyber.sourceIp} mono />
                        <KV label="Source Country" value={threat.cyber.sourceCountry} />
                        <KV label="ASN"            value={`${threat.cyber.asn} — ${threat.cyber.asnName}`} />
                        <KV label="Domain"         value={threat.cyber.domain} mono />
                        <KV label="Protocol"       value={threat.cyber.protocol} />
                        <KV label="Dest Port"      value={String(threat.cyber.destinationPort)} mono />
                    </div>
                )}

                {/* RF info */}
                {threat.category === 'RF' && threat.signal && (
                    <div className="space-y-1.5">
                        <KV label="Frequency" value={threat.signal.frequency} mono />
                        <KV label="Power"     value={threat.signal.powerDbm} mono />
                        <KV label="Distance"  value={threat.signal.distance} mono />
                        <div className="mt-2">
                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Waveform</div>
                            <div className="h-12 flex items-end gap-0.5">
                                {Array.from({ length: 24 }, (_, i) => (
                                    <div key={i} className="flex-1 rounded-sm" style={{
                                        height: `${20 + Math.random() * 80}%`,
                                        background: SEVERITY_COLORS[threat.severity],
                                        opacity: 0.6,
                                    }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Response plan */}
                {threat.responsePlan && (
                    <div className="p-2 rounded border bg-slate-900/40 border-white/5">
                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Response Plan</div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: ACTION_COLOR[threat.responsePlan] }}></span>
                            <span className="text-xs font-bold text-slate-200">{ACTION_LABELS[threat.responsePlan]}</span>
                        </div>
                    </div>
                )}

                {/* Status / actions */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                    {threat.status === 'neutralized' ? (
                        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded text-emerald-400 text-xs">
                            <div className="font-bold mb-1">✓ THREAT NEUTRALIZED</div>
                            {threat.counterMeasure && <div className="font-mono text-[10px] opacity-80">{threat.counterMeasure}</div>}
                        </div>
                    ) : (
                        <button
                            onClick={onNeutralize}
                            className="w-full py-2.5 bg-rose-500/10 border border-rose-500/40 text-rose-400 font-bold uppercase text-xs rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                            ⚡ Engage Countermeasure
                        </button>
                    )}
                    {threat.cyber?.domain && (
                        <button
                            onClick={() => onBlockDomain(threat.cyber!.domain)}
                            className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase text-[10px] rounded-lg hover:bg-amber-500/20 transition-colors"
                        >
                            ⊘ Block domain {threat.cyber.domain}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const KV: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900/40 border border-white/5">
        <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0">{label}</span>
        <span className={`text-xs text-slate-200 truncate ${mono ? 'mono' : ''}`} title={value}>{value}</span>
    </div>
);

// =============================================================================
//  LEGACY EXPORTS (kept for back-compat with existing tests/types)
// =============================================================================

// Re-export the legacy Threat/AnimationLine types to satisfy any external imports
export type { ThreatEvent as Threat, ThreatCategory };
export type AnimationLine = { id: number; positions: [number, number][]; color: string; type: 'attack' | 'defense' };

import React, { useState, useMemo } from 'react';
import { Server } from '../types';
import { SERVERS } from '../constants';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';

type FilterType = 'all' | 'optimized';
type SortType = 'latency' | 'country' | 'city';

export const ServerSelector: React.FC = () => {
  const { currentServer, selectServer } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('latency');
  const { t } = useLocalization();

  const processedServers = useMemo(() => {
    return SERVERS
      .filter(s => {
        if (filter === 'optimized') return s.tier === 'optimized';
        return true;
      })
      .filter(s => 
        t(s.country).toLowerCase().includes(search.toLowerCase()) || 
        s.city.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'latency') return a.latency - b.latency;
        if (sortBy === 'country') return t(a.country).localeCompare(t(b.country)) || a.city.localeCompare(b.city);
        if (sortBy === 'city') return a.city.localeCompare(b.city);
        return 0;
      });
  }, [search, filter, sortBy, t]);

  const getLoadColor = (load: number, isDot = false) => {
    if (load < 40) return isDot ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-green-400';
    if (load < 75) return isDot ? 'bg-amber-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return isDot ? 'bg-rose-500' : 'bg-gradient-to-r from-rose-500 to-red-400';
  };

  const SortButton: React.FC<{ sortType: SortType; children: React.ReactNode }> = ({ sortType, children }) => (
    <button
      onClick={() => setSortBy(sortType)}
      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
        sortBy === sortType ? 'bg-slate-700 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="glass rounded-3xl p-6 flex flex-col h-full max-h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">{t('infrastructureNodes')}</h3>
        <div className="flex items-center gap-2 glass rounded-lg p-1">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>All</button>
          <button onClick={() => setFilter('optimized')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${filter === 'optimized' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
             <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.449l-7.416 4.02L6.064 15.134 0 9.306l8.332-1.151L12 .587z"/></svg>
            Optimized
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg p-1 ml-2">
            <SortButton sortType="latency">Latency</SortButton>
            <SortButton sortType="country">Country</SortButton>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 space-y-2 flex-1 scrollbar-hide">
        {processedServers.map((server) => (
          <button
            key={server.id}
            onClick={() => selectServer(server)}
            className={`w-full flex items-center p-3 rounded-xl transition-all border group ${
              currentServer.id === server.id 
                ? 'bg-cyan-500/10 border-cyan-500/50' 
                : 'bg-transparent border-transparent hover:bg-white/5'
            }`}
          >
            <span className="text-2xl mr-4 grayscale-[0.2] group-hover:grayscale-0 transition-all">{server.flag}</span>
            <div className="text-left">
              <div className="text-sm font-bold group-hover:text-cyan-400 transition-colors flex items-center">
                {server.city.replace(' (Optimized)','')}
                {server.tier === 'optimized' && (
                  <svg className="w-4 h-4 text-cyan-400 fill-current ml-1.5" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.449l-7.416 4.02L6.064 15.134 0 9.306l8.332-1.151L12 .587z"/></svg>
                )}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">{t(server.country)}</div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className={`text-[10px] mono font-bold ${server.latency < 50 ? 'text-emerald-400' : server.latency < 100 ? 'text-amber-400' : 'text-rose-400'}`}>
                {server.latency}ms
              </span>
              <div className="flex flex-col items-end">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getLoadColor(server.load)} transition-all duration-500`} 
                    style={{ width: `${server.load}%` }} 
                  />
                </div>
              </div>
               <div className={`w-2 h-2 rounded-full ${getLoadColor(server.load, true)} shadow-sm shadow-black`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

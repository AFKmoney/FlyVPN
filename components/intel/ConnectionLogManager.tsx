import React from 'react';
import { LogEntry, VPNConfig } from '../../types';
import { Toggle } from '../ui/Toggle';

interface ConnectionLogManagerProps {
    onClose: () => void;
    logs: LogEntry[];
    setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    clearLogs: () => void;
    config: VPNConfig;
    updateConfig: (key: keyof VPNConfig, value: any) => void;
}

export const ConnectionLogManager: React.FC<ConnectionLogManagerProps> = ({ onClose, logs, setLogs, clearLogs, config, updateConfig}) => {
    
    const handleClearLogs = () => {
        clearLogs();
    };

    const handleExportLogs = () => {
        if (logs.length === 0) return;

        try {
            const fileContent = logs.map(log => `${new Date(log.timestamp).toISOString()} [${log.event}] ${log.details}`).join('\n');
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `flyvpn_logs_${Date.now()}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error("Failed to export logs", e);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col z-50 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-cyan-400">Connection Log Manager</h2>
                <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white transition-colors">&times;</button>
            </div>

            <div className="glass rounded-2xl p-6 mb-4 flex-shrink-0">
                <p className="text-sm text-slate-400 mb-4">
                    FLYVPN operates under a strict no-logs policy. These logs are stored <b className="text-slate-200">only on your device</b>, are never transmitted, and can be disabled or cleared at any time.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                         <Toggle enabled={config.logManagerEnabled} onChange={v => updateConfig('logManagerEnabled', v)} label="Enable Local Logging" description="Record connection events on this device." />
                    </div>
                    <button onClick={handleClearLogs} disabled={logs.length === 0} className="bg-rose-500/10 text-rose-400 rounded-lg h-12 font-bold text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Clear Logs</button>
                    <button onClick={handleExportLogs} disabled={logs.length === 0} className="bg-cyan-500/10 text-cyan-400 rounded-lg h-12 font-bold text-sm hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Export Logs</button>
                </div>
            </div>

            <div className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0">
                <div className="overflow-y-auto h-full">
                    {logs.length > 0 ? (
                        [...logs].reverse().map((log, index) => (
                            <div key={index} className="flex items-start gap-3 text-xs mono border-b border-white/5 py-2">
                                <span className="text-slate-500 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold ${log.event === 'Error' ? 'text-rose-400' : 'text-cyan-400'}`}>{log.event}</span>
                                <span className="text-slate-300 break-all">{log.details}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            {config.logManagerEnabled ? 'No log entries yet.' : 'Logging is disabled.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
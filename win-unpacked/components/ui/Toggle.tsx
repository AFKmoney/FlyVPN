
import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {description && <span className="text-xs text-slate-400">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          enabled ? 'bg-cyan-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
    </div>
  );
};

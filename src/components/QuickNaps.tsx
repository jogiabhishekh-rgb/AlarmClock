import React from 'react';
import { Zap, Moon } from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface QuickNapsProps {
  onAddQuickNap: (minutes: number, label: string) => void;
  theme: ThemeConfig;
}

const NAP_PRESETS = [
  { minutes: 5, label: '5m Power Nap', desc: 'Instant rest' },
  { minutes: 15, label: '15m Micro Nap', desc: 'Mental reset' },
  { minutes: 25, label: '25m Pomodoro', desc: 'Focus sprint' },
  { minutes: 45, label: '45m Deep Rest', desc: 'Alertness boost' },
  { minutes: 60, label: '60m Full Cycle', desc: 'Sleep cycle' },
];

export const QuickNaps: React.FC<QuickNapsProps> = ({ onAddQuickNap, theme }) => {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${theme.accentBg} ${theme.accentText}`}>
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Quick Nap & Timer Presets</h4>
            <p className="text-xs text-slate-400">Set an alarm with 1 tap from current time</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-3">
        {NAP_PRESETS.map((preset) => (
          <button
            key={preset.minutes}
            onClick={() => onAddQuickNap(preset.minutes, preset.label)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/80 transition-all text-center group active:scale-[0.97]"
          >
            <span className="font-mono-numbers text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              +{preset.minutes}m
            </span>
            <span className="text-[11px] font-medium text-slate-300 mt-0.5">{preset.label}</span>
            <span className="text-[10px] text-slate-500">{preset.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Plus, Sliders, Bell, Globe, Timer, Hourglass } from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

export type ActiveTab = 'alarms' | 'world' | 'stopwatch' | 'timer';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewAlarm: () => void;
  onOpenSettings: () => void;
  theme: ThemeConfig;
  activeAlarmsCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewAlarm,
  onOpenSettings,
  theme,
  activeAlarmsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090b10]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single Brand text element */}
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${theme.accentBg} ${theme.accentBorder} border ring-2 ${theme.ringColor} animate-pulse`} />
          <span className="text-xl font-bold tracking-tight text-white font-mono-numbers">
            Chrono<span className={theme.accentText}>Neon</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('alarms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'alarms'
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Alarms</span>
            {activeAlarmsCount > 0 && (
              <span className="ml-1 text-[11px] font-mono-numbers px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {activeAlarmsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('world')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'world'
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>World Clock</span>
          </button>

          <button
            onClick={() => onTabChange('stopwatch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'stopwatch'
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>Stopwatch</span>
          </button>

          <button
            onClick={() => onTabChange('timer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'timer'
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Hourglass className="h-3.5 w-3.5" />
            <span>Timer</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSettings}
            title="Settings & Theme"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenNewAlarm}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${theme.buttonPrimary}`}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Set Alarm</span>
            <span className="sm:hidden">Alarm</span>
          </button>
        </div>
      </div>
    </header>
  );
};

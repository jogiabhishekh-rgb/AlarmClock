import React, { useEffect, useState } from 'react';
import { Bell, Volume2, Mic, Clock, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Alarm } from '../types/alarm';
import { ThemeConfig } from '../utils/theme';
import { formatTime24to12 } from '../utils/timeFormat';

interface RingingModalProps {
  alarm: Alarm;
  spokenText?: string;
  isSpeaking: boolean;
  onSnooze: (alarmId: string, minutes?: number) => void;
  onDismiss: (alarmId: string) => void;
  onReplaySpeech: () => void;
  snoozeDuration: number;
  theme: ThemeConfig;
  use24h: boolean;
}

export const RingingModal: React.FC<RingingModalProps> = ({
  alarm,
  spokenText,
  isSpeaking,
  onSnooze,
  onDismiss,
  onReplaySpeech,
  snoozeDuration,
  theme,
  use24h,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Live ticking current time in the modal
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const s = d.getSeconds().toString().padStart(2, '0');

      if (use24h) {
        setCurrentTimeStr(`${h.toString().padStart(2, '0')}:${m}:${s}`);
      } else {
        const period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setCurrentTimeStr(`${h12.toString().padStart(2, '0')}:${m}:${s} ${period}`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [use24h]);

  // Keyboard accessibility: Space to snooze, Esc to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onDismiss(alarm.id);
      } else if (e.code === 'Space') {
        e.preventDefault();
        onSnooze(alarm.id, snoozeDuration);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alarm.id, snoozeDuration, onDismiss, onSnooze]);

  const { time: time12, period } = formatTime24to12(alarm.time);
  const scheduledTimeDisplay = use24h ? alarm.time : `${time12} ${period}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Soft Neon Aura */}
      <div
        className={`pointer-events-none absolute h-96 w-96 rounded-full blur-3xl opacity-30 animate-pulse ${theme.accentBg}`}
      />

      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border ${theme.accentBorder} bg-[#0c0f17] p-6 sm:p-8 text-center shadow-2xl ${theme.accentBoxClass}`}
      >
        {/* Animated Sound Waves Header */}
        <div className="flex items-center justify-center gap-1.5 h-10 mb-4">
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '0ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '150ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '300ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '450ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '200ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '350ms' }} />
          <span className={`w-1 rounded-full bg-cyan-400 animate-wave-bar`} style={{ animationDelay: '100ms' }} />
        </div>

        {/* Pulsing Alarm Bell Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border border-slate-700/80 shadow-inner">
          <Bell className={`h-10 w-10 fill-current animate-bounce ${theme.accentText}`} />
        </div>

        {/* Alarm Label & Scheduled Time */}
        <div className="mt-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Alarm Ringing ({scheduledTimeDisplay})
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {alarm.label || 'Wake Up Time!'}
          </h2>

          {/* Current Live Time */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1 text-xs font-mono-numbers text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Current Time: {currentTimeStr}</span>
          </div>
        </div>

        {/* AI Voice Greeting Subtitles Card */}
        {spokenText && (
          <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className={`flex items-center gap-1.5 font-semibold ${theme.accentText}`}>
                <Mic className={`h-3.5 w-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <span>AI Voice Greeting</span>
              </span>
              <button
                onClick={onReplaySpeech}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Re-read greeting aloud"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Repeat</span>
              </button>
            </div>
            <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
              "{spokenText}"
            </p>
          </div>
        )}

        {/* ACTION BUTTONS: Snooze (5 min) & Dismiss */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* SNOOZE BUTTON */}
          <button
            onClick={() => onSnooze(alarm.id, snoozeDuration)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700/90 py-4 px-6 text-base font-semibold text-slate-100 hover:text-white transition-all shadow-lg active:scale-[0.98]"
          >
            <Clock className="h-5 w-5 text-amber-400" />
            <span>Snooze ({snoozeDuration}m)</span>
          </button>

          {/* DISMISS / STOP BUTTON */}
          <button
            onClick={() => onDismiss(alarm.id)}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-base font-bold transition-all shadow-xl active:scale-[0.98] ${theme.buttonPrimary}`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Dismiss</span>
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Space</kbd> to Snooze</span>
          <span aria-hidden="true">·</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> to Dismiss</span>
        </div>
      </div>
    </div>
  );
};

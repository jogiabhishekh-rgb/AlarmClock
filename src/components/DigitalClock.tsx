import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Calendar, Clock, Sparkles } from 'lucide-react';
import { Alarm } from '../types/alarm';
import { ThemeConfig } from '../utils/theme';
import { getMsUntilAlarm, formatTimeRemaining, DAY_NAMES_FULL } from '../utils/timeFormat';

interface DigitalClockProps {
  use24h: boolean;
  onToggleFormat: () => void;
  alarms: Alarm[];
  theme: ThemeConfig;
  soundUnlocked: boolean;
  onUnlockSound: () => void;
  onTriggerTestAlarm: () => void;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  use24h,
  onToggleFormat,
  alarms,
  theme,
  soundUnlocked,
  onUnlockSound,
  onTriggerTestAlarm,
}) => {
  const [now, setNow] = useState<Date>(new Date());

  // Update time precisely every 100ms for accurate tick transition
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  let displayHours = hours;
  let period = '';

  if (!use24h) {
    period = hours >= 12 ? 'PM' : 'AM';
    displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
  }

  const hoursFormatted = displayHours.toString().padStart(2, '0');
  const minutesFormatted = minutes.toString().padStart(2, '0');
  const secondsFormatted = seconds.toString().padStart(2, '0');

  // Format full date: e.g. "Thursday, September 24, 2026"
  const dayName = DAY_NAMES_FULL[now.getDay()];
  const dateFormatted = now.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate the next upcoming alarm
  const activeAlarms = alarms.filter((a) => a.isEnabled);
  let nextAlarmInfo: { alarm: Alarm; msRemaining: number } | null = null;

  if (activeAlarms.length > 0) {
    let minMs = Infinity;
    let closestAlarm: Alarm | null = null;
    activeAlarms.forEach((alarm) => {
      const ms = getMsUntilAlarm(alarm, now);
      if (ms < minMs) {
        minMs = ms;
        closestAlarm = alarm;
      }
    });

    if (closestAlarm && isFinite(minMs)) {
      nextAlarmInfo = { alarm: closestAlarm, msRemaining: minMs };
    }
  }

  // Timezone string
  const timezoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#0e121b] to-[#0a0c14] p-6 sm:p-10 shadow-2xl transition-all">
      {/* Background Ambient Glow */}
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full blur-3xl opacity-20 ${theme.accentBg}`}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Top bar with Format Toggle and Audio Unlocked indicator */}
        <div className="flex w-full items-center justify-between pb-6 border-b border-slate-800/50 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{timezoneStr}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFormat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
              title="Toggle between 12-hour and 24-hour mode"
            >
              <span>{use24h ? '24-Hour' : '12-Hour'}</span>
              <span className="text-[10px] text-slate-500 uppercase">switch</span>
            </button>

            {!soundUnlocked ? (
              <button
                onClick={onUnlockSound}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                title="Browser requires interaction to enable alarm sound"
              >
                <VolumeX className="h-3.5 w-3.5" />
                <span>Enable Sound</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Audio Active</span>
              </span>
            )}
          </div>
        </div>

        {/* HERO DIGITAL TIME DISPLAY */}
        <div className="my-6 sm:my-10 flex flex-col items-center">
          <div className="flex items-baseline justify-center select-none">
            {/* Primary Hours & Minutes & Seconds */}
            <div
              className={`font-mono-numbers text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-white ${theme.accentGlowClass}`}
            >
              <span>{hoursFormatted}</span>
              <span className="inline-block px-1 sm:px-2 opacity-80 animate-pulse text-slate-400">:</span>
              <span>{minutesFormatted}</span>
              <span className="inline-block px-1 sm:px-2 opacity-80 animate-pulse text-slate-400">:</span>
              <span>{secondsFormatted}</span>
            </div>

            {/* AM/PM Indicator (only in 12-hour mode) */}
            {!use24h && (
              <div className="ml-2 sm:ml-4 flex flex-col items-start">
                <span
                  className={`font-mono-numbers text-xl sm:text-3xl font-bold tracking-wider ${
                    period === 'AM' ? theme.accentText : 'text-slate-400'
                  }`}
                >
                  {period}
                </span>
              </div>
            )}
          </div>

          {/* Current Date Display */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base font-medium text-slate-300">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-white">{dayName}</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span>{dateFormatted}</span>
          </div>
        </div>

        {/* UPCOMING ALARM OR QUICK TEST BANNER */}
        <div className="w-full max-w-xl rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  nextAlarmInfo ? `${theme.accentBg} ${theme.accentText}` : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Bell className={`h-4 w-4 ${nextAlarmInfo ? 'animate-bounce' : ''}`} />
              </div>
              <div className="text-left">
                {nextAlarmInfo ? (
                  <>
                    <p className="font-medium text-slate-200">
                      Next alarm in{' '}
                      <span className={`font-mono-numbers font-bold ${theme.accentText}`}>
                        {formatTimeRemaining(nextAlarmInfo.msRemaining)}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                      {nextAlarmInfo.alarm.label || 'Alarm'} ({nextAlarmInfo.alarm.time})
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-300">No alarms currently active</p>
                    <p className="text-[11px] text-slate-500">Enable an alarm below to schedule alerts</p>
                  </>
                )}
              </div>
            </div>

            {/* Test Alarm Trigger Button */}
            <button
              onClick={onTriggerTestAlarm}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap"
              title="Test the ring modal with speech greeting and chime immediately"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Simulate Alarm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

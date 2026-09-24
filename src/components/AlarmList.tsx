import React from 'react';
import {
  Bell,
  BellOff,
  Trash2,
  Edit2,
  Volume2,
  Mic,
  Calendar,
  Clock,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Alarm } from '../types/alarm';
import { ThemeConfig } from '../utils/theme';
import { formatTime24to12, getDaysLabel, getMsUntilAlarm, formatTimeRemaining } from '../utils/timeFormat';

interface AlarmListProps {
  alarms: Alarm[];
  use24h: boolean;
  theme: ThemeConfig;
  onToggleAlarm: (id: string) => void;
  onEditAlarm: (alarm: Alarm) => void;
  onDeleteAlarm: (id: string) => void;
  onOpenNewAlarm: () => void;
  onPreviewSound: (alarm: Alarm) => void;
  onCancelSnooze: (id: string) => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  use24h,
  theme,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  onOpenNewAlarm,
  onPreviewSound,
  onCancelSnooze,
}) => {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-4">
          <BellOff className="h-7 w-7 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No alarms created yet</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">
          Set up a personalized wake-up alarm with custom chimes and AI voice greetings.
        </p>
        <button
          onClick={onOpenNewAlarm}
          className={`mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${theme.buttonPrimary}`}
        >
          <Plus className="h-4 w-4" />
          <span>Create New Alarm</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Configured Alarms ({alarms.length})</span>
        </div>
        <button
          onClick={onOpenNewAlarm}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme.buttonPrimary}`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Alarm</span>
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {alarms.map((alarm) => {
          const { time: time12, period } = formatTime24to12(alarm.time);
          const displayTime = use24h ? alarm.time : time12;
          const daysText = getDaysLabel(alarm.days);
          const isSnoozed = alarm.snoozedUntil && alarm.snoozedUntil > Date.now();
          const msRemaining = alarm.isEnabled ? getMsUntilAlarm(alarm) : null;

          return (
            <div
              key={alarm.id}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                alarm.isEnabled
                  ? 'border-slate-700/80 bg-slate-900/80 hover:border-slate-600 shadow-lg shadow-black/30'
                  : 'border-slate-800/50 bg-slate-950/40 opacity-70 hover:opacity-90'
              }`}
            >
              {/* Subtle accent side indicator when enabled */}
              {alarm.isEnabled && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.buttonPrimary}`} />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
                {/* Left zone: Time, Label, Metadata */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      alarm.isEnabled
                        ? `${theme.accentBg} ${theme.accentBorder} ${theme.accentText}`
                        : 'border-slate-800 bg-slate-900 text-slate-500'
                    }`}
                    title={alarm.isEnabled ? 'Alarm is Active (Click to disable)' : 'Alarm is Off (Click to enable)'}
                  >
                    <Bell className={`h-5 w-5 ${alarm.isEnabled ? 'fill-current' : ''}`} />
                  </button>

                  <div>
                    {/* Time Display */}
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-mono-numbers text-3xl sm:text-4xl font-extrabold tracking-tight ${
                          alarm.isEnabled ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {displayTime}
                      </span>
                      {!use24h && (
                        <span
                          className={`font-mono-numbers text-sm sm:text-base font-bold uppercase ${
                            alarm.isEnabled ? theme.accentText : 'text-slate-500'
                          }`}
                        >
                          {period}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="mt-1">
                      <h4
                        className={`text-sm font-semibold truncate max-w-xs sm:max-w-md ${
                          alarm.isEnabled ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {alarm.label || 'Alarm'}
                      </h4>
                    </div>

                    {/* Metadata line (Anti-slop zero-pill clean text) */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>{daysText}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-600">·</span>

                      <span className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3 text-slate-500" />
                        <span className="capitalize">{alarm.soundId.replace('-', ' ')}</span>
                      </span>

                      {alarm.speechGreetingEnabled && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className={`flex items-center gap-1 ${theme.accentText}`}>
                            <Mic className="h-3 w-3" />
                            <span className="capitalize">{alarm.speechStyle} AI Greeting</span>
                          </span>
                        </>
                      )}

                      {alarm.isEnabled && msRemaining !== null && isFinite(msRemaining) && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-300 font-medium">
                            in {formatTimeRemaining(msRemaining)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Active Snooze Badge */}
                    {isSnoozed && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-300">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>Snoozed: rings in {formatTimeRemaining(alarm.snoozedUntil! - Date.now())}</span>
                        <button
                          onClick={() => onCancelSnooze(alarm.id)}
                          className="ml-2 underline hover:text-amber-100 flex items-center gap-1"
                          title="Cancel snooze and reset alarm"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Cancel Snooze</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right zone: Actions & Toggle Switch */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      onClick={() => onPreviewSound(alarm)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Preview alarm sound and speech greeting"
                      aria-label="Preview sound"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onEditAlarm(alarm)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Edit alarm settings"
                      aria-label="Edit alarm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete alarm"
                      aria-label="Delete alarm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    role="switch"
                    aria-checked={alarm.isEnabled}
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      alarm.isEnabled ? theme.buttonPrimary : 'bg-slate-800'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        alarm.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

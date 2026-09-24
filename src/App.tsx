/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { DigitalClock } from './components/DigitalClock';
import { AlarmList } from './components/AlarmList';
import { AlarmModal } from './components/AlarmModal';
import { RingingModal } from './components/RingingModal';
import { QuickNaps } from './components/QuickNaps';
import { WorldClock } from './components/WorldClock';
import { StopwatchTimer } from './components/StopwatchTimer';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Alarm, AppSettings, RingingAlarmState } from './types/alarm';
import { THEME_CONFIGS } from './utils/theme';
import {
  loadAlarms,
  saveAlarms,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { audioSynthesizer } from './utils/audioSynthesizer';
import { speechService } from './utils/speechService';
import { formatTime24to12 } from './utils/timeFormat';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('alarms');
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadAlarms());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active ringing alarm state
  const [activeRinging, setActiveRinging] = useState<RingingAlarmState | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track last triggered alarm minute to avoid multiple triggers within the same 60 seconds
  const lastTriggeredMapRef = useRef<Record<string, string>>({});

  // Theme object
  const theme = THEME_CONFIGS[settings.neonColor] || THEME_CONFIGS.cyan;

  // Persist alarms
  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Handle user audio unlock gesture on first interaction
  const handleUnlockSound = useCallback(async () => {
    const success = await audioSynthesizer.unlockAudio();
    if (success) {
      setSettings((prev) => ({ ...prev, soundUnlocked: true }));
    }
  }, []);

  // Trigger an alarm to ring
  const triggerAlarmRing = useCallback(
    (alarm: Alarm) => {
      // 1. Play repeating synthesized alarm chime
      audioSynthesizer.startAlarm(alarm.soundId, settings.volume);

      // 2. Build spoken greeting text
      const { time: time12, period } = formatTime24to12(alarm.time);
      const timeFormatted = settings.format24h ? alarm.time : `${time12} ${period}`;
      const spokenText = speechService.generateGreeting(
        alarm.speechStyle,
        timeFormatted,
        alarm.label,
        alarm.customQuote
      );

      // 3. Trigger Web Speech API greeting if enabled
      if (alarm.speechGreetingEnabled) {
        setIsSpeaking(true);
        speechService.speak(
          spokenText,
          {
            voiceURI: settings.speechVoiceURI,
            rate: settings.speechRate,
            pitch: settings.speechPitch,
            volume: settings.volume,
          },
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }

      // 4. Set ringing modal state
      setActiveRinging({
        alarm,
        ringStartedAt: Date.now(),
        currentSpokenText: alarm.speechGreetingEnabled ? spokenText : undefined,
      });
    },
    [settings]
  );

  // Core background clock watcher (runs every second)
  useEffect(() => {
    const checkAlarms = () => {
      // If an alarm is already actively ringing on screen, skip checking others
      if (activeRinging) return;

      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const currentTimeKey = `${currentH}:${currentM}`;
      const currentDay = now.getDay();
      const currentTimestamp = now.getTime();

      alarms.forEach((alarm) => {
        if (!alarm.isEnabled) return;

        // Check if currently snoozed and snooze time arrived
        if (alarm.snoozedUntil && currentTimestamp >= alarm.snoozedUntil) {
          // Clear snooze timestamp and trigger
          setAlarms((prev) =>
            prev.map((a) => (a.id === alarm.id ? { ...a, snoozedUntil: null } : a))
          );
          triggerAlarmRing(alarm);
          return;
        }

        // Check standard scheduled alarm time
        if (alarm.time === currentTimeKey) {
          const minuteIdentifier = `${alarm.id}_${now.toDateString()}_${currentTimeKey}`;
          if (lastTriggeredMapRef.current[alarm.id] === minuteIdentifier) {
            // Already triggered this minute
            return;
          }

          // Check if day matches
          const isDayMatch = !alarm.days || alarm.days.length === 0 || alarm.days.includes(currentDay);
          if (isDayMatch) {
            lastTriggeredMapRef.current[alarm.id] = minuteIdentifier;
            triggerAlarmRing(alarm);
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, activeRinging, triggerAlarmRing]);

  // SNOOZE ACTION
  const handleSnooze = (alarmId: string, minutes = settings.snoozeDurationMinutes) => {
    audioSynthesizer.stopAlarm();
    speechService.cancel();
    setIsSpeaking(false);

    const snoozeUntilTime = Date.now() + minutes * 60 * 1000;

    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === alarmId) {
          return {
            ...a,
            snoozedUntil: snoozeUntilTime,
            snoozeCount: (a.snoozeCount || 0) + 1,
          };
        }
        return a;
      })
    );

    setActiveRinging(null);
  };

  // DISMISS ACTION
  const handleDismiss = (alarmId: string) => {
    audioSynthesizer.stopAlarm();
    speechService.cancel();
    setIsSpeaking(false);

    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === alarmId) {
          // If it was a one-time alarm (empty days), disable it
          const shouldDisable = !a.days || a.days.length === 0;
          return {
            ...a,
            isEnabled: shouldDisable ? false : a.isEnabled,
            snoozedUntil: null,
            snoozeCount: 0,
          };
        }
        return a;
      })
    );

    setActiveRinging(null);
  };

  // Cancel an active snooze
  const handleCancelSnooze = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, snoozedUntil: null, snoozeCount: 0 } : a))
    );
  };

  // Replay speech greeting in ringing modal
  const handleReplaySpeech = () => {
    if (!activeRinging || !activeRinging.currentSpokenText) return;
    setIsSpeaking(true);
    speechService.speak(
      activeRinging.currentSpokenText,
      {
        voiceURI: settings.speechVoiceURI,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.volume,
      },
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Toggle alarm enable / disable
  const handleToggleAlarm = (id: string) => {
    handleUnlockSound();
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextState = !a.isEnabled;
          return {
            ...a,
            isEnabled: nextState,
            // If turning off, clear any active snooze
            snoozedUntil: nextState ? a.snoozedUntil : null,
          };
        }
        return a;
      })
    );
  };

  // Save new or edited alarm
  const handleSaveAlarm = (alarmData: Omit<Alarm, 'id' | 'createdAt'> & { id?: string }) => {
    handleUnlockSound();
    if (alarmData.id) {
      // Edit existing
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === alarmData.id
            ? {
                ...a,
                ...alarmData,
                snoozedUntil: null,
              }
            : a
        )
      );
    } else {
      // Add new
      const newAlarm: Alarm = {
        ...alarmData,
        id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now(),
      };
      setAlarms((prev) => [newAlarm, ...prev]);
    }
  };

  // Delete alarm
  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // Quick nap tap preset
  const handleAddQuickNap = (minutes: number, label: string) => {
    handleUnlockSound();
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);

    const hStr = d.getHours().toString().padStart(2, '0');
    const mStr = d.getMinutes().toString().padStart(2, '0');

    const newAlarm: Alarm = {
      id: `nap-${Date.now()}`,
      time: `${hStr}:${mStr}`,
      label,
      isEnabled: true,
      days: [], // one-time
      soundId: 'morning-marimba',
      speechGreetingEnabled: true,
      speechStyle: 'energetic',
      createdAt: Date.now(),
    };

    setAlarms((prev) => [newAlarm, ...prev]);
    setActiveTab('alarms');
  };

  // Preview sound & speech
  const handlePreviewAlarm = (alarm: Alarm) => {
    handleUnlockSound();
    audioSynthesizer.previewSound(alarm.soundId, settings.volume);
    if (alarm.speechGreetingEnabled) {
      const { time: time12, period } = formatTime24to12(alarm.time);
      const spokenText = speechService.generateGreeting(
        alarm.speechStyle,
        `${time12} ${period}`,
        alarm.label,
        alarm.customQuote
      );
      speechService.speak(spokenText, {
        voiceURI: settings.speechVoiceURI,
        volume: settings.volume,
      });
    }
  };

  // Instant simulator for user test
  const handleTriggerTestAlarm = () => {
    handleUnlockSound();
    const mockAlarm: Alarm = alarms[0] || {
      id: 'test-alarm',
      time: '07:00',
      label: 'Morning Rise & Shine',
      isEnabled: true,
      days: [1, 2, 3, 4, 5],
      soundId: 'gentle-chime',
      speechGreetingEnabled: true,
      speechStyle: 'motivational',
      createdAt: Date.now(),
    };
    triggerAlarmRing(mockAlarm);
  };

  const activeAlarmsCount = alarms.filter((a) => a.isEnabled).length;

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewAlarm={() => {
          setEditingAlarm(null);
          setIsAlarmModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        activeAlarmsCount={activeAlarmsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Tab 1: Alarms (Primary View) */}
        {activeTab === 'alarms' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Live Digital Clock */}
            <DigitalClock
              use24h={settings.format24h}
              onToggleFormat={() =>
                setSettings((s) => ({ ...s, format24h: !s.format24h }))
              }
              alarms={alarms}
              theme={theme}
              soundUnlocked={settings.soundUnlocked}
              onUnlockSound={handleUnlockSound}
              onTriggerTestAlarm={handleTriggerTestAlarm}
            />

            {/* Quick Nap 1-Tap Presets */}
            <QuickNaps onAddQuickNap={handleAddQuickNap} theme={theme} />

            {/* Configured Alarms List */}
            <AlarmList
              alarms={alarms}
              use24h={settings.format24h}
              theme={theme}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={(alarm) => {
                setEditingAlarm(alarm);
                setIsAlarmModalOpen(true);
              }}
              onDeleteAlarm={handleDeleteAlarm}
              onOpenNewAlarm={() => {
                setEditingAlarm(null);
                setIsAlarmModalOpen(true);
              }}
              onPreviewSound={handlePreviewAlarm}
              onCancelSnooze={handleCancelSnooze}
            />
          </div>
        )}

        {/* Tab 2: World Clock */}
        {activeTab === 'world' && (
          <div className="animate-in fade-in duration-200">
            <WorldClock use24h={settings.format24h} theme={theme} />
          </div>
        )}

        {/* Tab 3: Stopwatch */}
        {activeTab === 'stopwatch' && (
          <div className="animate-in fade-in duration-200">
            <StopwatchTimer theme={theme} volume={settings.volume} />
          </div>
        )}

        {/* Tab 4: Countdown Timer */}
        {activeTab === 'timer' && (
          <div className="animate-in fade-in duration-200">
            <StopwatchTimer theme={theme} volume={settings.volume} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#07090d] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            ChronoNeon Smart Clock · Built with HTML, Tailwind CSS & Web Speech API
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Sound & Voice Settings
            </button>
            <span>·</span>
            <button
              onClick={handleTriggerTestAlarm}
              className="hover:text-slate-300 transition-colors"
            >
              Simulate Alarm
            </button>
          </div>
        </div>
      </footer>

      {/* ALARM MODAL (Add / Edit) */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => {
          setIsAlarmModalOpen(false);
          setEditingAlarm(null);
        }}
        onSave={handleSaveAlarm}
        initialAlarm={editingAlarm}
        use24h={settings.format24h}
        theme={theme}
        volume={settings.volume}
      />

      {/* RINGING MODAL POPUP (When alarm rings) */}
      {activeRinging && (
        <RingingModal
          alarm={activeRinging.alarm}
          spokenText={activeRinging.currentSpokenText}
          isSpeaking={isSpeaking}
          onSnooze={handleSnooze}
          onDismiss={handleDismiss}
          onReplaySpeech={handleReplaySpeech}
          snoozeDuration={settings.snoozeDurationMinutes}
          theme={theme}
          use24h={settings.format24h}
        />
      )}

      {/* SETTINGS DRAWER */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        theme={theme}
      />
    </div>
  );
}

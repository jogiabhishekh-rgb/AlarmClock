export type SoundId = 'gentle-chime' | 'digital-beep' | 'zen-bell' | 'morning-marimba' | 'radar-pulse';

export type SpeechStyle = 'energetic' | 'motivational' | 'mindful' | 'simple' | 'custom';

export type ThemeAccent = 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose';

export interface Alarm {
  id: string;
  time: string; // "HH:mm" in 24-hour format, e.g. "07:00"
  label: string;
  isEnabled: boolean;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat. Empty array means "Once"
  soundId: SoundId;
  speechGreetingEnabled: boolean;
  speechStyle: SpeechStyle;
  customQuote?: string;
  snoozeCount?: number;
  snoozedUntil?: number | null; // epoch timestamp in ms if currently snoozed
  createdAt: number;
}

export interface AppSettings {
  format24h: boolean;
  snoozeDurationMinutes: number; // default 5
  neonColor: ThemeAccent;
  volume: number; // 0.0 to 1.0
  speechVoiceURI: string;
  speechRate: number; // 0.8 to 1.2
  speechPitch: number; // 0.8 to 1.2
  soundUnlocked: boolean;
}

export interface RingingAlarmState {
  alarm: Alarm;
  ringStartedAt: number;
  currentSpokenText?: string;
}

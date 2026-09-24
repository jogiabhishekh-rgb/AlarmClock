import { Alarm, AppSettings } from '../types/alarm';

const ALARMS_STORAGE_KEY = 'chrononeon_alarms_v1';
const SETTINGS_STORAGE_KEY = 'chrononeon_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  format24h: false,
  snoozeDurationMinutes: 5,
  neonColor: 'cyan',
  volume: 0.8,
  speechVoiceURI: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  soundUnlocked: false,
};

export const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    time: '07:00',
    label: 'Morning Rise & Shine',
    isEnabled: true,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    soundId: 'gentle-chime',
    speechGreetingEnabled: true,
    speechStyle: 'motivational',
    createdAt: Date.now() - 100000,
  },
  {
    id: 'alarm-2',
    time: '08:30',
    label: 'Focus & Productivity',
    isEnabled: false,
    days: [1, 2, 3, 4, 5],
    soundId: 'morning-marimba',
    speechGreetingEnabled: true,
    speechStyle: 'energetic',
    createdAt: Date.now() - 50000,
  },
  {
    id: 'alarm-3',
    time: '22:30',
    label: 'Evening Wind-Down',
    isEnabled: false,
    days: [0, 1, 2, 3, 4, 5, 6],
    soundId: 'zen-bell',
    speechGreetingEnabled: true,
    speechStyle: 'mindful',
    createdAt: Date.now() - 20000,
  },
];

export function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (!raw) return INITIAL_ALARMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_ALARMS;
  } catch {
    return INITIAL_ALARMS;
  }
}

export function saveAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch {
    // ignore
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

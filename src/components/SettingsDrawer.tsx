import React, { useState, useEffect } from 'react';
import { X, Volume2, Sliders, Mic, Palette, BellRing, Sparkles, Check } from 'lucide-react';
import { AppSettings, ThemeAccent } from '../types/alarm';
import { ThemeConfig, THEME_CONFIGS } from '../utils/theme';
import { audioSynthesizer } from '../utils/audioSynthesizer';
import { speechService } from '../utils/speechService';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  theme: ThemeConfig;
}

const THEME_ACCENTS: { id: ThemeAccent; label: string; colorDot: string }[] = [
  { id: 'cyan', label: 'Cyan Neon', colorDot: 'bg-cyan-400 shadow-cyan-500/50' },
  { id: 'emerald', label: 'Emerald Aurora', colorDot: 'bg-emerald-400 shadow-emerald-500/50' },
  { id: 'amber', label: 'Amber Glow', colorDot: 'bg-amber-400 shadow-amber-500/50' },
  { id: 'purple', label: 'Electric Violet', colorDot: 'bg-purple-400 shadow-purple-500/50' },
  { id: 'rose', label: 'Rose Coral', colorDot: 'bg-rose-400 shadow-rose-500/50' },
];

const SNOOZE_OPTIONS = [3, 5, 10, 15];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  theme,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  useEffect(() => {
    setVoices(speechService.getVoices());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestChime = () => {
    setIsPlayingTestSound(true);
    audioSynthesizer.previewSound('gentle-chime', settings.volume);
    setTimeout(() => setIsPlayingTestSound(false), 2000);
  };

  const handleTestSpeech = () => {
    if (isSpeakingTest) {
      speechService.cancel();
      setIsSpeakingTest(false);
      return;
    }
    setIsSpeakingTest(true);
    const greeting = speechService.generateGreeting('motivational', '7:00 AM', 'Daily Goals');
    speechService.speak(
      greeting,
      {
        voiceURI: settings.speechVoiceURI,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.volume,
      },
      () => setIsSpeakingTest(true),
      () => setIsSpeakingTest(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1017] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className={`h-5 w-5 ${theme.accentText}`} />
            <h3 className="text-lg font-bold text-white">Clock & Alarm Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* 1. NEON COLOR THEME */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Neon Accent Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_ACCENTS.map((t) => {
                const isSelected = settings.neonColor === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, neonColor: t.id })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? `${theme.accentBg} ${theme.accentBorder} text-white font-semibold shadow-md`
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full shadow-sm ${t.colorDot}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SNOOZE DURATION */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Default Snooze Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SNOOZE_OPTIONS.map((min) => {
                const isSelected = settings.snoozeDurationMinutes === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, snoozeDurationMinutes: min })}
                    className={`py-2 rounded-xl border text-xs font-mono-numbers transition-all ${
                      isSelected
                        ? `${theme.accentBg} ${theme.accentBorder} ${theme.accentText} font-bold`
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {min} minutes
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ALARM AUDIO VOLUME */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-white">Alarm Master Volume</span>
              </div>
              <span className="text-xs font-mono-numbers text-slate-400">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdateSettings({ ...settings, volume: vol });
                audioSynthesizer.updateVolume(vol);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleTestChime}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white rounded-lg border border-slate-700 bg-slate-800/80 transition-colors"
              >
                <BellRing className="h-3.5 w-3.5" />
                <span>{isPlayingTestSound ? 'Playing Chime...' : 'Test Volume'}</span>
              </button>
            </div>
          </div>

          {/* 4. WEB SPEECH API SYNTHESIS CONFIGURATION */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-white">Web Speech API Voice Settings</span>
            </div>

            {voices.length > 0 ? (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Voice</label>
                <select
                  value={settings.speechVoiceURI}
                  onChange={(e) => onUpdateSettings({ ...settings, speechVoiceURI: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Default System Voice</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Default device voice is active</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Speech Speed</span>
                  <span className="font-mono">{settings.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, speechRate: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Speech Pitch</span>
                  <span className="font-mono">{settings.speechPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={settings.speechPitch}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, speechPitch: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleTestSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white rounded-lg border border-slate-700 bg-slate-800/80 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{isSpeakingTest ? 'Stop Voice' : 'Test Speech Greeting'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${theme.buttonPrimary}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

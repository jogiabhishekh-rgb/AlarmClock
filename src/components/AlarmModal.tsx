import React, { useState, useEffect } from 'react';
import { X, Volume2, Mic, Check, Play, Square, Sparkles } from 'lucide-react';
import { Alarm, SoundId, SpeechStyle } from '../types/alarm';
import { ThemeConfig } from '../utils/theme';
import { audioSynthesizer } from '../utils/audioSynthesizer';
import { speechService } from '../utils/speechService';
import { DAY_NAMES_SHORT, formatTime24to12 } from '../utils/timeFormat';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id' | 'createdAt'> & { id?: string }) => void;
  initialAlarm: Alarm | null;
  use24h: boolean;
  theme: ThemeConfig;
  volume: number;
}

const SOUND_OPTIONS: { id: SoundId; name: string; description: string }[] = [
  { id: 'gentle-chime', name: 'Gentle Chime', description: 'Harmonic crystalline bell chime' },
  { id: 'morning-marimba', name: 'Morning Marimba', description: 'Warm acoustic ascending melody' },
  { id: 'zen-bell', name: 'Zen Bowl', description: 'Deep meditation gong tone' },
  { id: 'digital-beep', name: 'Digital Beep', description: 'Classic high-energy alarm pulses' },
  { id: 'radar-pulse', name: 'Radar Pulse', description: 'Futuristic sweep pulse' },
];

const SPEECH_STYLES: { id: SpeechStyle; name: string; description: string }[] = [
  { id: 'motivational', name: 'Motivational', description: 'Inspiring quote about focus and success' },
  { id: 'energetic', name: 'High Energy', description: 'Upbeat and bold wake-up reminder' },
  { id: 'mindful', name: 'Mindful & Calm', description: 'Gentle, breath-centered start to the day' },
  { id: 'simple', name: 'Simple & Crisp', description: 'Just the time and alarm label' },
  { id: 'custom', name: 'Custom Quote', description: 'Your own words with dynamic {greeting} tags' },
];

const LABEL_SUGGESTIONS = [
  'Rise & Shine',
  'Morning Workout',
  'Daily Standup',
  'Deep Focus Block',
  'Take Medication',
  'Power Nap',
];

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAlarm,
  use24h,
  theme,
  volume,
}) => {
  const [hours, setHours] = useState('07');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [label, setLabel] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [soundId, setSoundId] = useState<SoundId>('gentle-chime');
  const [speechGreetingEnabled, setSpeechGreetingEnabled] = useState(true);
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>('motivational');
  const [customQuote, setCustomQuote] = useState('');
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isSpeakingPreview, setIsSpeakingPreview] = useState(false);

  useEffect(() => {
    if (initialAlarm) {
      const [h, m] = initialAlarm.time.split(':');
      const hNum = parseInt(h, 10);
      if (use24h) {
        setHours(h);
        setMinutes(m);
      } else {
        const p: 'AM' | 'PM' = hNum >= 12 ? 'PM' : 'AM';
        let h12 = hNum % 12;
        if (h12 === 0) h12 = 12;
        setHours(h12.toString().padStart(2, '0'));
        setMinutes(m);
        setPeriod(p);
      }
      setLabel(initialAlarm.label || '');
      setDays(initialAlarm.days || []);
      setSoundId(initialAlarm.soundId || 'gentle-chime');
      setSpeechGreetingEnabled(initialAlarm.speechGreetingEnabled ?? true);
      setSpeechStyle(initialAlarm.speechStyle || 'motivational');
      setCustomQuote(initialAlarm.customQuote || '');
    } else {
      // Default to next nearest round hour
      const d = new Date();
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
      const h = d.getHours();
      if (use24h) {
        setHours(h.toString().padStart(2, '0'));
      } else {
        const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setHours(h12.toString().padStart(2, '0'));
        setPeriod(p);
      }
      setMinutes('00');
      setLabel('Rise & Shine');
      setDays([1, 2, 3, 4, 5]);
      setSoundId('gentle-chime');
      setSpeechGreetingEnabled(true);
      setSpeechStyle('motivational');
      setCustomQuote('');
    }
  }, [initialAlarm, isOpen, use24h]);

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex: number) => {
    if (days.includes(dayIndex)) {
      setDays(days.filter((d) => d !== dayIndex));
    } else {
      setDays([...days, dayIndex].sort((a, b) => a - b));
    }
  };

  const handleSelectDayPreset = (preset: 'daily' | 'weekdays' | 'weekends' | 'once') => {
    switch (preset) {
      case 'daily':
        setDays([0, 1, 2, 3, 4, 5, 6]);
        break;
      case 'weekdays':
        setDays([1, 2, 3, 4, 5]);
        break;
      case 'weekends':
        setDays([0, 6]);
        break;
      case 'once':
        setDays([]);
        break;
    }
  };

  const handlePreviewSound = (sId: SoundId) => {
    setIsPlayingSound(true);
    audioSynthesizer.previewSound(sId, volume);
    setTimeout(() => {
      setIsPlayingSound(false);
    }, 2000);
  };

  const handleTestSpeech = () => {
    if (isSpeakingPreview) {
      speechService.cancel();
      setIsSpeakingPreview(false);
      return;
    }

    let timeFormatted = `${hours}:${minutes}`;
    if (!use24h) {
      timeFormatted += ` ${period}`;
    }

    const textToSpeak = speechService.generateGreeting(
      speechStyle,
      timeFormatted,
      label,
      customQuote
    );

    setIsSpeakingPreview(true);
    speechService.speak(
      textToSpeak,
      { volume },
      () => setIsSpeakingPreview(true),
      () => setIsSpeakingPreview(false)
    );
  };

  const handleSave = () => {
    // Convert to 24-hour HH:mm
    let hNum = parseInt(hours, 10);
    if (isNaN(hNum)) hNum = 7;

    if (!use24h) {
      if (period === 'PM' && hNum < 12) hNum += 12;
      if (period === 'AM' && hNum === 12) hNum = 0;
    }

    let mNum = parseInt(minutes, 10);
    if (isNaN(mNum)) mNum = 0;
    mNum = Math.max(0, Math.min(59, mNum));

    const timeStr = `${hNum.toString().padStart(2, '0')}:${mNum.toString().padStart(2, '0')}`;

    onSave({
      id: initialAlarm ? initialAlarm.id : undefined,
      time: timeStr,
      label: label.trim() || 'Alarm',
      isEnabled: true,
      days,
      soundId,
      speechGreetingEnabled,
      speechStyle,
      customQuote: speechStyle === 'custom' ? customQuote : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1017] p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{initialAlarm ? 'Edit Alarm' : 'Set New Alarm'}</span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* 1. TIME PICKER */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Alarm Time
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Hours Input */}
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={use24h ? 0 : 1}
                  max={use24h ? 23 : 12}
                  value={hours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHours(val.slice(-2));
                  }}
                  onBlur={() => {
                    let num = parseInt(hours, 10);
                    if (isNaN(num)) num = use24h ? 7 : 7;
                    if (use24h) {
                      num = Math.max(0, Math.min(23, num));
                    } else {
                      num = Math.max(1, Math.min(12, num));
                    }
                    setHours(num.toString().padStart(2, '0'));
                  }}
                  className={`w-20 sm:w-24 text-center font-mono-numbers text-4xl sm:text-5xl font-extrabold rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 py-2`}
                />
                <span className="text-[10px] text-slate-500 uppercase mt-1">Hours</span>
              </div>

              <span className="text-3xl sm:text-4xl font-mono-numbers font-bold text-slate-500 mb-4">:</span>

              {/* Minutes Input */}
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinutes(val.slice(-2));
                  }}
                  onBlur={() => {
                    let num = parseInt(minutes, 10);
                    if (isNaN(num)) num = 0;
                    num = Math.max(0, Math.min(59, num));
                    setMinutes(num.toString().padStart(2, '0'));
                  }}
                  className={`w-20 sm:w-24 text-center font-mono-numbers text-4xl sm:text-5xl font-extrabold rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 py-2`}
                />
                <span className="text-[10px] text-slate-500 uppercase mt-1">Minutes</span>
              </div>

              {/* AM/PM Toggle */}
              {!use24h && (
                <div className="flex flex-col gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-mono-numbers ${
                      period === 'AM'
                        ? theme.buttonPrimary
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-mono-numbers ${
                      period === 'PM'
                        ? theme.buttonPrimary
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. LABEL & SUGGESTIONS */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Alarm Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Morning Rise & Shine, Gym, Meeting"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {/* Quick label chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LABEL_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLabel(item)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    label === item
                      ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 3. REPEAT SCHEDULE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Repeat Schedule
              </label>
              <div className="flex items-center gap-1">
                {(['daily', 'weekdays', 'weekends', 'once'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectDayPreset(preset)}
                    className="text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 capitalize transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {DAY_NAMES_SHORT.map((day, idx) => {
                const isSelected = days.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? `${theme.accentBg} ${theme.accentText} ${theme.accentBorder} font-bold`
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    {isSelected && <div className={`mt-1 h-1 w-1 rounded-full ${theme.buttonPrimary}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SOUND PICKER */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Alarm Sound Chime
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SOUND_OPTIONS.map((snd) => {
                const isSelected = soundId === snd.id;
                return (
                  <div
                    key={snd.id}
                    onClick={() => setSoundId(snd.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all flex items-center justify-between ${
                      isSelected
                        ? `${theme.accentBg} ${theme.accentBorder}`
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={`text-xs font-bold ${isSelected ? theme.accentText : 'text-slate-200'}`}>
                        {snd.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{snd.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSound(snd.id);
                      }}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Preview this sound chime"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. AI / TEXT-TO-SPEECH GREETING */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${theme.accentBg} ${theme.accentText}`}>
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI / Voice Speech Greeting</h4>
                  <p className="text-[11px] text-slate-400">
                    Speaks time & personalized wake-up quote using Web Speech API
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={speechGreetingEnabled}
                onClick={() => setSpeechGreetingEnabled(!speechGreetingEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  speechGreetingEnabled ? theme.buttonPrimary : 'bg-slate-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    speechGreetingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {speechGreetingEnabled && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SPEECH_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSpeechStyle(st.id)}
                      className={`text-left p-2 rounded-lg border text-xs transition-all ${
                        speechStyle === st.id
                          ? `${theme.accentBg} ${theme.accentBorder} font-medium`
                          : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className={`font-semibold ${speechStyle === st.id ? theme.accentText : 'text-slate-200'}`}>
                        {st.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{st.description}</p>
                    </button>
                  ))}
                </div>

                {speechStyle === 'custom' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Custom Greeting Text (use <code className="text-cyan-300">&#123;greeting&#125;</code>, <code className="text-cyan-300">&#123;time&#125;</code>, <code className="text-cyan-300">&#123;label&#125;</code>)
                    </label>
                    <textarea
                      rows={2}
                      value={customQuote}
                      onChange={(e) => setCustomQuote(e.target.value)}
                      placeholder="{greeting}! It is {time}. Rise and conquer {label}!"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {/* Preview speech test button */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleTestSpeech}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 transition-colors"
                  >
                    {isSpeakingPreview ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current text-rose-400" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                        <span>Test Voice Greeting</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-xl border border-slate-800 bg-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${theme.buttonPrimary}`}
          >
            {initialAlarm ? 'Save Changes' : 'Create Alarm'}
          </button>
        </div>
      </div>
    </div>
  );
};

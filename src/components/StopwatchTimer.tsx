import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Timer, Hourglass, Check } from 'lucide-react';
import { ThemeConfig } from '../utils/theme';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface StopwatchTimerProps {
  theme: ThemeConfig;
  volume: number;
}

export const StopwatchTimer: React.FC<StopwatchTimerProps> = ({ theme, volume }) => {
  const [subMode, setSubMode] = useState<'stopwatch' | 'timer'>('stopwatch');

  // --- STOPWATCH STATE ---
  const [swTime, setSwTime] = useState(0); // in ms
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<{ id: number; lapTime: number; overallTime: number }[]>([]);
  const swIntervalRef = useRef<number | null>(null);
  const swStartTimeRef = useRef<number>(0);
  const swAccumulatedRef = useRef<number>(0);

  useEffect(() => {
    if (swRunning) {
      swStartTimeRef.current = performance.now();
      swIntervalRef.current = window.setInterval(() => {
        const elapsed = performance.now() - swStartTimeRef.current;
        setSwTime(swAccumulatedRef.current + elapsed);
      }, 10);
    } else {
      if (swIntervalRef.current) {
        clearInterval(swIntervalRef.current);
        swIntervalRef.current = null;
      }
    }
    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    };
  }, [swRunning]);

  const handleSwToggle = () => {
    if (swRunning) {
      swAccumulatedRef.current = swTime;
      setSwRunning(false);
    } else {
      setSwRunning(true);
    }
  };

  const handleSwReset = () => {
    setSwRunning(false);
    swAccumulatedRef.current = 0;
    setSwTime(0);
    setLaps([]);
  };

  const handleSwLap = () => {
    const prevOverall = laps.length > 0 ? laps[0].overallTime : 0;
    const lapTime = swTime - prevOverall;
    setLaps([{ id: laps.length + 1, lapTime, overallTime: swTime }, ...laps]);
  };

  const formatStopwatch = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return {
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0'),
      ms: centis.toString().padStart(2, '0'),
    };
  };

  // --- TIMER STATE ---
  const [timerInitialSec, setTimerInitialSec] = useState(300); // 5 mins
  const [timerRemainingSec, setTimerRemainingSec] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerRemainingSec((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerRunning(false);
            setTimerFinished(true);
            audioSynthesizer.previewSound('gentle-chime', volume);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, volume]);

  const handleTimerStart = () => {
    setTimerFinished(false);
    if (timerRemainingSec <= 0) {
      setTimerRemainingSec(timerInitialSec);
    }
    setTimerRunning(true);
  };

  const handleTimerPause = () => {
    setTimerRunning(false);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerRemainingSec(timerInitialSec);
  };

  const setTimerPreset = (secs: number) => {
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerInitialSec(secs);
    setTimerRemainingSec(secs);
  };

  const formatTimerSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const swFormatted = formatStopwatch(swTime);

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubMode('stopwatch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              subMode === 'stopwatch'
                ? `${theme.accentBg} ${theme.accentText} ${theme.accentBorder} border`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>Stopwatch</span>
          </button>
          <button
            onClick={() => setSubMode('timer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              subMode === 'timer'
                ? `${theme.accentBg} ${theme.accentText} ${theme.accentBorder} border`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hourglass className="h-4 w-4" />
            <span>Countdown Timer</span>
          </button>
        </div>
      </div>

      {subMode === 'stopwatch' ? (
        /* STOPWATCH VIEW */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="my-6">
            <span
              className={`font-mono-numbers text-6xl sm:text-8xl font-extrabold tracking-tight text-white ${theme.accentGlowClass}`}
            >
              {swFormatted.m}:{swFormatted.s}
            </span>
            <span className="font-mono-numbers text-3xl sm:text-4xl text-slate-500 font-bold ml-2">
              .{swFormatted.ms}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleSwReset}
              disabled={swTime === 0}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 transition-colors"
              title="Reset stopwatch"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={handleSwToggle}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all shadow-xl active:scale-95 ${
                swRunning
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : theme.buttonPrimary
              }`}
              title={swRunning ? 'Pause stopwatch' : 'Start stopwatch'}
            >
              {swRunning ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current ml-0.5" />}
            </button>

            <button
              onClick={handleSwLap}
              disabled={!swRunning}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 transition-colors"
              title="Record Lap"
            >
              <Flag className="h-5 w-5" />
            </button>
          </div>

          {/* Laps Table */}
          {laps.length > 0 && (
            <div className="w-full max-w-md mt-8 border-t border-slate-800 pt-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
                <span>Lap #</span>
                <span>Lap Time</span>
                <span>Overall</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 pr-1">
                {laps.map((lap) => {
                  const lapF = formatStopwatch(lap.lapTime);
                  const overallF = formatStopwatch(lap.overallTime);
                  return (
                    <div key={lap.id} className="flex items-center justify-between py-2.5 px-2 text-xs font-mono-numbers">
                      <span className="font-semibold text-slate-400">Lap {lap.id}</span>
                      <span className="text-white font-medium">+{lapF.m}:{lapF.s}.{lapF.ms}</span>
                      <span className="text-slate-400">{overallF.m}:{overallF.s}.{overallF.ms}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* COUNTDOWN TIMER VIEW */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 flex flex-col items-center text-center">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[60, 180, 300, 600, 900, 1500].map((sec) => (
              <button
                key={sec}
                onClick={() => setTimerPreset(sec)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  timerInitialSec === sec
                    ? `${theme.accentBg} ${theme.accentBorder} ${theme.accentText} font-bold`
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
              </button>
            ))}
          </div>

          <div className="my-6">
            <span
              className={`font-mono-numbers text-7xl sm:text-9xl font-extrabold tracking-tight ${
                timerFinished ? 'text-rose-400 animate-pulse' : 'text-white'
              } ${theme.accentGlowClass}`}
            >
              {formatTimerSeconds(timerRemainingSec)}
            </span>
          </div>

          {timerFinished && (
            <p className="text-sm font-bold text-rose-400 mb-2">Timer finished! Time to check in.</p>
          )}

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleTimerReset}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            {timerRunning ? (
              <button
                onClick={handleTimerPause}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                title="Pause timer"
              >
                <Pause className="h-7 w-7 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleTimerStart}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl active:scale-95 transition-all ${theme.buttonPrimary}`}
                title="Start timer"
              >
                <Play className="h-7 w-7 fill-current ml-0.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

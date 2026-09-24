import { ThemeAccent } from '../types/alarm';

export interface ThemeConfig {
  name: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentGlowClass: string;
  accentBoxClass: string;
  ringColor: string;
  buttonPrimary: string;
  pillActive: string;
}

export const THEME_CONFIGS: Record<ThemeAccent, ThemeConfig> = {
  cyan: {
    name: 'Cyan Neon',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    accentGlowClass: 'neon-glow-cyan',
    accentBoxClass: 'neon-box-cyan',
    ringColor: 'ring-cyan-400',
    buttonPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/25',
    pillActive: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  emerald: {
    name: 'Emerald Aurora',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    accentGlowClass: 'neon-glow-emerald',
    accentBoxClass: 'neon-box-emerald',
    ringColor: 'ring-emerald-400',
    buttonPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/25',
    pillActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  amber: {
    name: 'Amber Glow',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    accentGlowClass: 'neon-glow-amber',
    accentBoxClass: 'neon-box-amber',
    ringColor: 'ring-amber-400',
    buttonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/25',
    pillActive: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  purple: {
    name: 'Electric Violet',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    accentGlowClass: 'neon-glow-purple',
    accentBoxClass: 'neon-box-purple',
    ringColor: 'ring-purple-400',
    buttonPrimary: 'bg-purple-500 hover:bg-purple-400 text-white font-semibold shadow-lg shadow-purple-500/25',
    pillActive: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  rose: {
    name: 'Rose Coral',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/30',
    accentGlowClass: 'neon-glow-rose',
    accentBoxClass: 'neon-box-rose',
    ringColor: 'ring-rose-400',
    buttonPrimary: 'bg-rose-500 hover:bg-rose-400 text-white font-semibold shadow-lg shadow-rose-500/25',
    pillActive: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

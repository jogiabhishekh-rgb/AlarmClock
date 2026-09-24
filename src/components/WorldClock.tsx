import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface WorldCity {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

const DEFAULT_CITIES: WorldCity[] = [
  { id: '1', name: 'New York', country: 'United States', timezone: 'America/New_York' },
  { id: '2', name: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { id: '3', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { id: '4', name: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  { id: '5', name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  { id: '6', name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  { id: '7', name: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  { id: '8', name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
];

interface WorldClockProps {
  use24h: boolean;
  theme: ThemeConfig;
}

export const WorldClock: React.FC<WorldClockProps> = ({ use24h, theme }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeForZone = (timezone: string) => {
    try {
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: !use24h,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return { timeStr, dateStr };
    } catch {
      return { timeStr: '--:--:--', dateStr: 'Invalid TZ' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">World Clock</h3>
          <p className="text-xs text-slate-400">Live time in major global cities and financial hubs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEFAULT_CITIES.map((city) => {
          const { timeStr, dateStr } = getTimeForZone(city.timezone);
          return (
            <div
              key={city.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{city.name}</h4>
                  <p className="text-xs text-slate-400">{city.country}</p>
                </div>
                <span className="text-[10px] font-mono rounded bg-slate-800 px-2 py-0.5 text-slate-400">
                  {city.timezone.split('/')[1]?.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4">
                <p className={`font-mono-numbers text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.accentText}`}>
                  {timeStr}
                </p>
                <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

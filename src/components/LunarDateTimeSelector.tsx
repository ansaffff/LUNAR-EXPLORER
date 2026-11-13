import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, Check, Sun, Moon, Compass } from 'lucide-react';
import { LunarAstroData } from '../utils/lunarAstro';

interface LunarDateTimeSelectorProps {
  currentDate: Date;
  astroData: LunarAstroData;
  onApplyDateTime: (date: Date) => void;
  isAstronomicalLighting: boolean;
  onToggleLightingMode: () => void;
}

export const LunarDateTimeSelector: React.FC<LunarDateTimeSelectorProps> = ({
  currentDate,
  astroData,
  onApplyDateTime,
  isAstronomicalLighting,
  onToggleLightingMode,
}) => {
  // Format helpers for date (YYYY-MM-DD) and time (HH:mm) in UTC
  const formatUtcDate = (d: Date) => {
    try {
      return d.toISOString().split('T')[0];
    } catch {
      return '2026-09-15';
    }
  };

  const formatUtcTime = (d: Date) => {
    try {
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '12:00';
    }
  };

  const [dateInput, setDateInput] = useState(() => formatUtcDate(currentDate));
  const [timeInput, setTimeInput] = useState(() => formatUtcTime(currentDate));
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
  const [recentlyApplied, setRecentlyApplied] = useState(false);

  // Synchronize internal inputs whenever currentDate prop changes
  useEffect(() => {
    setDateInput(formatUtcDate(currentDate));
    setTimeInput(formatUtcTime(currentDate));
    setHasUnappliedChanges(false);
  }, [currentDate]);

  // Quick Mission Epoch Presets
  const presets = [
    {
      label: 'Live Current Time',
      getDate: () => new Date(),
    },
    {
      label: 'Apollo 11 Touchdown (Jul 20, 1969)',
      getDate: () => new Date('1969-07-20T20:17:40Z'),
    },
    {
      label: 'Apollo 17 Touchdown (Dec 11, 1972)',
      getDate: () => new Date('1972-12-11T19:54:58Z'),
    },
    {
      label: 'Artemis Target (Sep 15, 2026)',
      getDate: () => new Date('2026-09-15T12:00:00Z'),
    },
  ];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInput(e.target.value);
    setHasUnappliedChanges(true);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
    setHasUnappliedChanges(true);
  };

  const handleApply = () => {
    if (!dateInput || !timeInput) return;
    const cleanTime = timeInput.length === 5 ? `${timeInput}:00` : timeInput;
    const combinedIso = `${dateInput}T${cleanTime}Z`;
    const parsed = new Date(combinedIso);
    if (!isNaN(parsed.getTime())) {
      onApplyDateTime(parsed);
      setHasUnappliedChanges(false);
      setRecentlyApplied(true);
      setTimeout(() => setRecentlyApplied(false), 2000);
    }
  };

  const handleSelectPreset = (presetDate: Date) => {
    setDateInput(formatUtcDate(presetDate));
    setTimeInput(formatUtcTime(presetDate));
    onApplyDateTime(presetDate);
    setHasUnappliedChanges(false);
    setRecentlyApplied(true);
    setTimeout(() => setRecentlyApplied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Top Row: Title, Active Astronomical Epoch Display & Lighting Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Lunar Ephemeris & Time Control
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40">
              Real Astronomical Calculation
            </span>
            {recentlyApplied && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 animate-fade-in">
                <Check className="w-3 h-3 text-emerald-400" />
                View & Calculations Updated
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-400 font-mono">
            <span>
              Active UTC: <strong className="text-slate-200">{astroData.utcDateString}</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="text-slate-400">
              Local: <strong className="text-slate-300">{astroData.localDateString}</strong>
            </span>
          </div>
        </div>

        {/* 3D Sun Lighting Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleLightingMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isAstronomicalLighting
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle between real astronomical lighting for the selected date or uniform full illumination"
          >
            {isAstronomicalLighting ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>
              {isAstronomicalLighting ? 'Lighting: Astronomical Sun' : 'Lighting: Full Disk'}
            </span>
          </button>
        </div>
      </div>

      {/* Middle Row: Date Picker, Time Picker, Quick Presets & Update Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Date and Time Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Input */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">UTC Date</span>
              <input
                type="date"
                value={dateInput}
                onChange={handleDateChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                className="bg-transparent text-white font-mono font-medium focus:outline-none cursor-pointer text-xs"
              />
            </div>
          </div>

          {/* Time Picker Input */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">UTC Time</span>
              <input
                type="time"
                value={timeInput}
                onChange={handleTimeChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                className="bg-transparent text-white font-mono font-medium focus:outline-none cursor-pointer text-xs"
              />
            </div>
          </div>

          {/* Calculate / Update View Button */}
          <button
            onClick={handleApply}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
              hasUnappliedChanges
                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40 animate-pulse'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${hasUnappliedChanges ? 'animate-spin' : ''}`} />
            <span>Update View & Calculate</span>
          </button>
        </div>

        {/* Quick Historical Mission Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mr-1 shrink-0">
            Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p.getDate())}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors whitespace-nowrap cursor-pointer text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Summary Bar: Clearly Display Active Astronomical Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* 1. Moon Phase & Illumination */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Moon Phase [Astro]
          </span>
          <span className="text-sm font-bold text-white block mt-0.5 truncate">
            {astroData.phaseName}
          </span>
          <span className="text-[11px] text-amber-300 font-mono mt-0.5 block">
            {astroData.illuminatedPercentage}% disk · Age: {astroData.lunarAgeDays}d
          </span>
        </div>

        {/* 2. Subsolar Point (Sun Position on Moon) */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Subsolar Point [Astro]
          </span>
          <span className="text-sm font-bold text-white block mt-0.5 font-mono">
            {astroData.subsolarLatitude >= 0 ? `${astroData.subsolarLatitude.toFixed(1)}°N` : `${Math.abs(astroData.subsolarLatitude).toFixed(1)}°S`},{' '}
            {astroData.subsolarLongitude >= 0 ? `${astroData.subsolarLongitude.toFixed(1)}°E` : `${Math.abs(astroData.subsolarLongitude).toFixed(1)}°W`}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Sun zenith coordinates
          </span>
        </div>

        {/* 3. Local Site Illumination */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Site Solar Status [Astro]
          </span>
          <span className={`text-sm font-bold block mt-0.5 ${
            astroData.isDaytime ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {astroData.lightingStatus}
          </span>
          <span className="text-[11px] text-slate-300 font-mono mt-0.5 block">
            Elev: {astroData.localSunElevationDegrees > 0 ? `+${astroData.localSunElevationDegrees}°` : `${astroData.localSunElevationDegrees}°`} · {astroData.localSunCompass}
          </span>
        </div>

        {/* 4. Earth Visibility from Site */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Earth Visibility [Astro]
          </span>
          <span className={`text-sm font-bold block mt-0.5 ${
            astroData.isEarthVisible ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {astroData.isEarthVisible ? 'Direct Line of Sight' : 'Blocked Horizon'}
          </span>
          <span className="text-[11px] text-slate-300 font-mono mt-0.5 block">
            Elev: {astroData.earthElevationDegrees > 0 ? `+${astroData.earthElevationDegrees}°` : `${astroData.earthElevationDegrees}°`} · {astroData.earthCompass}
          </span>
        </div>
      </div>
    </div>
  );
};

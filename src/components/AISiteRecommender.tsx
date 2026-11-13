import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, MapPin, CheckCircle2, ChevronRight, Loader2, Target, Award, Compass } from 'lucide-react';
import { LandingSite, deriveSiteData } from '../utils/lunarData';

export interface AIRecommendation {
  name: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  terrainType: string;
  whyRecommended: string;
  primaryAdvantage: string;
  missionFit: string;
}

interface AISiteRecommenderProps {
  onSelectSite: (site: LandingSite) => void;
  selectedSiteId?: string;
}

const DEFAULT_RECOMMENDATIONS: AIRecommendation[] = [
  {
    name: 'Mare Tranquillitatis (Apollo 11 Plains)',
    latitude: 0.67,
    longitude: 23.47,
    safetyScore: 96,
    terrainType: 'Flat Basaltic Lowland Sea',
    whyRecommended: 'Extremely flat basaltic lava sheets offer minimal slope hazard (under 2.2°) with verified touchdown stability and low rock density.',
    primaryAdvantage: 'Lowest slope and boulder hazard on nearside',
    missionFit: 'Safest Flat Touchdown'
  },
  {
    name: 'Oceanus Procellarum (Ocean of Storms)',
    latitude: 18.4,
    longitude: -57.4,
    safetyScore: 93,
    terrainType: 'Vast Volcanic Lowland Plain',
    whyRecommended: 'The largest contiguous mare basin on the Moon provides expansive landing corridors, smooth regolith, and continuous direct Earth line-of-sight.',
    primaryAdvantage: 'Expansive landing safety corridor',
    missionFit: 'Commercial Lander Baseline'
  },
  {
    name: 'Malapert Mountain Massif',
    latitude: -84.9,
    longitude: 12.9,
    safetyScore: 88,
    terrainType: 'High-Altitude South Polar Ridge',
    whyRecommended: 'Elevated peak receives over 90% annual illumination, providing nearly continuous solar power generation and uninterrupted direct radio contact with Earth.',
    primaryAdvantage: 'Quasi-permanent solar energy and Earth comms',
    missionFit: 'Continuous Solar Energy'
  },
  {
    name: 'Shackleton Crater Connecting Ridge',
    latitude: -89.9,
    longitude: 0.0,
    safetyScore: 84,
    terrainType: 'South Polar Cold Trap Rim',
    whyRecommended: 'Strategic Artemis candidate offering access to permanently shadowed cryogenic craters containing volatile water-ice deposits needed for fuel synthesis.',
    primaryAdvantage: 'Cryogenic water ice reserves for deep space',
    missionFit: 'Artemis Water-Ice Prospecting'
  }
];

export const AISiteRecommender: React.FC<AISiteRecommenderProps> = ({
  onSelectSite,
  selectedSiteId,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(DEFAULT_RECOMMENDATIONS);
  const [profile, setProfile] = useState<'balanced' | 'safest' | 'artemis' | 'scientific'>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<'gemini' | 'flight-dynamics'>('flight-dynamics');

  const fetchRecommendations = async (selectedProfile: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-recommended-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionProfile: selectedProfile }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.recommendations?.length > 0) {
          setRecommendations(data.recommendations);
          setSource(data.source === 'gemini' ? 'gemini' : 'flight-dynamics');
        }
      }
    } catch {
      // Fallback already pre-loaded
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (newProfile: 'balanced' | 'safest' | 'artemis' | 'scientific') => {
    setProfile(newProfile);
    fetchRecommendations(newProfile);
  };

  const handleTarget = (rec: AIRecommendation) => {
    const site = deriveSiteData(rec.latitude, rec.longitude);
    onSelectSite(site);
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">AI Recommended Landing Locations</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                {source === 'gemini' ? 'Gemini AI Evaluated' : 'Autonomous Flight Computer'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              The AI evaluates lunar topography, surface slopes, solar cycles, and hazard levels to find optimal landing zones.
            </p>
          </div>
        </div>

        {/* Refresh / Scan Button */}
        <button
          onClick={() => fetchRecommendations(profile)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isLoading ? 'Scanning Moon...' : 'Scan New Sites'}</span>
        </button>
      </div>

      {/* Mission Profile Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Target Mission:</span>
        <button
          onClick={() => handleProfileChange('balanced')}
          className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all cursor-pointer ${
            profile === 'balanced'
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          All-Round Best
        </button>
        <button
          onClick={() => handleProfileChange('safest')}
          className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all cursor-pointer ${
            profile === 'safest'
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Safest Flat Plains
        </button>
        <button
          onClick={() => handleProfileChange('artemis')}
          className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all cursor-pointer ${
            profile === 'artemis'
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Artemis & Water-Ice
        </button>
        <button
          onClick={() => handleProfileChange('scientific')}
          className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all cursor-pointer ${
            profile === 'scientific'
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          High-Value Samples
        </button>
      </div>

      {/* 4 Recommended Landing Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Top Row: Rank & Score */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    {rec.missionFit}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{rec.safetyScore}% Safe</span>
                </div>
              </div>

              {/* Site Name & Coordinates */}
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {rec.name}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {rec.latitude.toFixed(2)}° Lat, {rec.longitude.toFixed(2)}° Lon · {rec.terrainType}
              </p>

              {/* AI Recommendation Reason */}
              <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                {rec.whyRecommended}
              </p>
            </div>

            {/* Bottom Row: Key Advantage & Target Button */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-amber-300 font-medium truncate">
                ★ {rec.primaryAdvantage}
              </div>

              <button
                onClick={() => handleTarget(rec)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Target on Moon</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

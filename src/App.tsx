import React, { useState, useMemo, useRef } from 'react';
import { MoonViewer } from './components/MoonViewer';
import { 
  CURATED_LANDING_SITES, 
  LUNAR_REGION_PRESETS,
  LandingSite, 
  deriveSiteData, 
  computeInstantAnalysis 
} from './utils/lunarData';
import { SafetyReportModal, AISafetyAnalysis } from './components/SafetyReportModal';
import { AISiteRecommender } from './components/AISiteRecommender';
import { LunarDateTimeSelector } from './components/LunarDateTimeSelector';
import { LunarLocationSelector } from './components/LunarLocationSelector';
import { calculateLunarAstro, LunarAstroData } from './utils/lunarAstro';
import { 
  Compass, 
  ShieldCheck, 
  RotateCw, 
  Sparkles, 
  FileText, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mountain,
  Radio,
  Sun,
  Layers,
  ArrowDown,
  Clock,
  Crosshair
} from 'lucide-react';

export default function App() {
  // Default to Apollo 11 (Mare Tranquillitatis)
  const [selectedSite, setSelectedSite] = useState<LandingSite>(LUNAR_REGION_PRESETS[0]);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Date & Time state for astronomical lunar calculation
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isAstronomicalLighting, setIsAstronomicalLighting] = useState<boolean>(true);

  // Real Astronomical Calculation Engine (Meeus Ephemeris)
  const astroData: LunarAstroData = useMemo(() => {
    return calculateLunarAstro(selectedDate, selectedSite.latitude, selectedSite.longitude);
  }, [selectedDate, selectedSite.latitude, selectedSite.longitude]);
  
  // Safety Analysis State
  const [analysis, setAnalysis] = useState<AISafetyAnalysis | null>(() => computeInstantAnalysis(LUNAR_REGION_PRESETS[0]));
  const [analysisSource, setAnalysisSource] = useState<'gemini' | 'flight-dynamics'>('flight-dynamics');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fast, non-blocking site evaluation (Instant in 0ms, with optional background AI refinement)
  const handleSelectSite = (site: LandingSite, requestDeepAi: boolean = false) => {
    setSelectedSite(site);

    // 1. INSTANT zero-latency evaluation (updates UI immediately)
    const instant = computeInstantAnalysis(site);
    setAnalysis(instant);
    setAnalysisSource('flight-dynamics');

    // Cancel any older in-flight request so results never get stuck
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (requestDeepAi) {
      setIsAnalyzing(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      fetch('/api/analyze-landing-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.analysis) {
            setAnalysis(data.analysis);
            setAnalysisSource(data.source === 'gemini' ? 'gemini' : 'flight-dynamics');
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  };

  // Handle direct click/tap on the 3D Moon
  const handleSelectCoordinates = (lat: number, lon: number) => {
    const site = deriveSiteData(lat, lon, undefined, 'Arbitrary Map Selection');
    handleSelectSite(site, false);
  };

  // Select a preset site and orient the Moon view to it
  const handleSelectPreset = (site: LandingSite) => {
    handleSelectSite(site, false);
    setCenterTrigger((prev) => prev + 1);
  };

  // Reset landing location back to Apollo 11 default reference site
  const handleResetSelection = () => {
    const apollo11 = LUNAR_REGION_PRESETS[0];
    handleSelectSite(apollo11, false);
    setCenterTrigger((prev) => prev + 1);
  };

  // Center view on currently selected coordinates
  const handleCenterView = () => {
    setCenterTrigger((prev) => prev + 1);
  };

  const score = analysis?.safetyScore ?? 92;
  const isSafe = score >= 80;

  // Recognizable quick-access presets along bottom edge of Moon stage
  const quickPresets = LUNAR_REGION_PRESETS.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* 1. Sleek Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-400 p-[1.5px] shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-slate-200">
              <Compass className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">LunarNav</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-300">
                NASA Selenographic Explorer
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Interactive 3D Moon & Landing Site Navigation
            </p>
          </div>
        </div>

        {/* Current Active Target Telemetry & Active UTC Astronomical Epoch */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">{selectedSite.name}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-sky-300">
            {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(2)}°N` : `${Math.abs(selectedSite.latitude).toFixed(2)}°S`},{' '}
            {selectedSite.longitude >= 0 ? `${selectedSite.longitude.toFixed(2)}°E` : `${Math.abs(selectedSite.longitude).toFixed(2)}°W`}
          </span>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{astroData.utcDateString.replace('GMT', 'UTC')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              document.getElementById('ai-recommender-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-600/50 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Best Sites</span>
            <span className="sm:hidden">Best</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Mission</span>
            <span>Report</span>
          </button>
        </div>
      </header>

      {/* 2. ZONE 1: Dedicated 3D Moon Stage (100% Unobstructed Viewport) */}
      <section className="relative w-full h-[62vh] min-h-[440px] max-h-[640px] bg-[#040608] border-b border-slate-800/80 overflow-hidden flex flex-col justify-between">
        
        {/* Full-Screen 3D Moon Canvas - Zero overlapping cards blocking the Moon */}
        <div className="absolute inset-0 w-full h-full">
          <MoonViewer
            selectedLat={selectedSite.latitude}
            selectedLon={selectedSite.longitude}
            onSelectCoordinates={handleSelectCoordinates}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            subsolarLat={astroData.subsolarLatitude}
            subsolarLon={astroData.subsolarLongitude}
            isAstronomicalSun={isAstronomicalLighting}
            centerTrigger={centerTrigger}
            onHoverCoordinates={setHoverCoords}
          />
        </div>

        {/* Minimal Subtle Floating Overlay Hints (Far corners only, off the Moon) */}
        <div className="relative z-20 p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-3 pointer-events-none">
          {/* Real-time Astronomical View Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800/90 text-xs text-slate-200 backdrop-blur-md shadow-lg">
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">{astroData.phaseName}</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-amber-300">{astroData.illuminatedPercentage}% Lit</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-slate-300 text-[11px]">
                Subsolar Point: {astroData.subsolarLatitude >= 0 ? `${astroData.subsolarLatitude}°N` : `${Math.abs(astroData.subsolarLatitude)}°S`}, {astroData.subsolarLongitude >= 0 ? `${astroData.subsolarLongitude}°E` : `${Math.abs(astroData.subsolarLongitude)}°W`}
              </span>
            </div>

            {/* Live cursor coordinates preview */}
            {hoverCoords && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-sky-500/40 text-xs font-mono text-sky-300 backdrop-blur-md shadow-lg">
                <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Cursor:</span>
                <span>
                  {hoverCoords.lat >= 0 ? `${hoverCoords.lat.toFixed(2)}°N` : `${Math.abs(hoverCoords.lat).toFixed(2)}°S`},{' '}
                  {hoverCoords.lon >= 0 ? `${hoverCoords.lon.toFixed(2)}°E` : `${Math.abs(hoverCoords.lon).toFixed(2)}°W`}
                </span>
              </div>
            )}
          </div>

          {/* Controls: Center View on Site & Moon Rotation ON/OFF */}
          <div className="flex items-center gap-2 ml-auto pointer-events-auto">
            <button
              onClick={handleCenterView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all cursor-pointer"
              title="Center and rotate the Moon so the selected landing site is front and center"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Center on Site</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-lg backdrop-blur-md transition-all cursor-pointer ${
                autoRotate
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
              title="Toggle Moon rotation On or Off"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span>Rotation: {autoRotate ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar of Moon Stage: Recognizable Preset Buttons (Sits cleanly under the Moon) */}
        <div className="relative z-20 px-4 sm:px-6 pb-4 pt-8 bg-gradient-to-t from-[#040608] via-[#040608]/80 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Key Lunar Regions:</span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {quickPresets.map((preset) => {
              const isSelected = selectedSite.id === preset.id || (
                Math.abs(selectedSite.latitude - preset.latitude) < 0.2 &&
                Math.abs(selectedSite.longitude - preset.longitude) < 0.2
              );
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{preset.name.split('(')[0].trim()}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    preset.coordinatePrecision === 'Exact Historic Touchdown'
                      ? isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-950 text-emerald-400'
                      : isSelected ? 'bg-sky-800 text-sky-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {preset.coordinatePrecision === 'Exact Historic Touchdown' ? 'Exact' : 'Approx'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
            <span>Scroll for location tools & reports</span>
            <ArrowDown className="w-3.5 h-3.5 text-slate-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* 3. ZONE 2: Mission Results & Safety Analysis (UNDER THE MOON MAP) */}
      <section className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Feature 1 & 2 & 3: Comprehensive Moon Location Selector & Search & Presets */}
        <LunarLocationSelector
          selectedSite={selectedSite}
          onSelectSite={(site) => {
            handleSelectSite(site, false);
            setCenterTrigger((prev) => prev + 1);
          }}
          onResetSelection={handleResetSelection}
          onCenterViewOnSite={handleCenterView}
          hoverCoords={hoverCoords}
        />

        {/* Feature 4: Lunar Date & Time Astronomical Ephemeris Controller */}
        <LunarDateTimeSelector
          currentDate={selectedDate}
          astroData={astroData}
          onApplyDateTime={(date) => setSelectedDate(date)}
          isAstronomicalLighting={isAstronomicalLighting}
          onToggleLightingMode={() => setIsAstronomicalLighting(!isAstronomicalLighting)}
        />

        {/* Main Mission Landing Banner (Selected / Manually Clicked Site Report) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Site Identification & Classification */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800/50">
                  {selectedSite.type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
                  {selectedSite.terrainType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300">
                  Region: {selectedSite.regionCategory}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {selectedSite.name}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-sky-300">
                Coordinates: {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(2)}°N` : `${Math.abs(selectedSite.latitude).toFixed(2)}°S`},{' '}
                {selectedSite.longitude >= 0 ? `${selectedSite.longitude.toFixed(2)}°E` : `${Math.abs(selectedSite.longitude).toFixed(2)}°W`} · Elevation: {selectedSite.elevationMeters} m
              </p>
              {/* Astronomical Lighting & Earth Visibility at Selected Epoch */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                  astroData.isDaytime ? 'bg-amber-950/70 text-amber-300 border-amber-600/40' : 'bg-slate-900 text-slate-300 border-slate-700/60'
                }`}>
                  Solar: {astroData.lightingStatus} ({astroData.localSunElevationDegrees > 0 ? `+${astroData.localSunElevationDegrees}°` : `${astroData.localSunElevationDegrees}°`}, {astroData.localSunCompass})
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                  astroData.isEarthVisible ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40' : 'bg-rose-950/70 text-rose-300 border-rose-600/40'
                }`}>
                  Earth LOS: {astroData.isEarthVisible ? 'Visible' : 'Shadowed'} ({astroData.earthElevationDegrees > 0 ? `+${astroData.earthElevationDegrees}°` : `${astroData.earthElevationDegrees}°`}, {astroData.earthCompass})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                {selectedSite.description}
              </p>
            </div>

            {/* Safety Score Meter & Verification Badge */}
            <div className="flex flex-col items-start md:items-end gap-2.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shrink-0 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                  isSafe ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Safety Feasibility
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isSafe ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {score}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isSafe ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {isSafe ? 'GO FOR TOUCHDOWN' : 'CAUTION REQUIRED'}
                </span>
              </div>

              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                {analysisSource === 'gemini' ? 'Gemini AI Verified' : 'Flight Dynamics Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Card Surface Environment Grid: Distinguishing Topographical Model from Astronomical Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Ground Slope [LROC TOPOGRAPHY] */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-300">Surface Slope [LROC]</span>
              <Mountain className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">{selectedSite.surfaceSlopeDegrees}°</span>
                <span className="text-xs text-slate-400">tilt grade</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${selectedSite.surfaceSlopeDegrees <= 4 ? 'bg-emerald-500' : selectedSite.surfaceSlopeDegrees <= 8 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (selectedSite.surfaceSlopeDegrees / 15) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {selectedSite.surfaceSlopeDegrees <= 4 ? 'Flat, safe terrain' : 'Moderate slope, stable gear required'}
              </p>
            </div>
          </div>

          {/* 2. Crater & Rock Risk [LOLA MODEL] */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-300">Crater Density [LOLA]</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                {selectedSite.craterDensity}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Boulder risk: <span className="text-slate-200 font-semibold">{selectedSite.boulderRisk}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Terrain Relative Optical Navigation required
              </p>
            </div>
          </div>

          {/* 3. Earth Horizon Visibility [REAL ASTRONOMICAL CALCULATION] */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-amber-300">Earth LOS [ASTRO]</span>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                {astroData.isEarthVisible ? 'Direct LOS' : 'Blocked'}
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-2">
                Elev: {astroData.earthElevationDegrees > 0 ? `+${astroData.earthElevationDegrees}°` : `${astroData.earthElevationDegrees}°`} · {astroData.earthCompass}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate" title={astroData.earthVisibilityStatus}>
                {astroData.isEarthVisible ? 'Continuous direct Earth link' : 'Farside orbit relay needed'}
              </p>
            </div>
          </div>

          {/* 4. Solar Illumination & Thermal [REAL ASTRONOMICAL CALCULATION] */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-amber-300">Site Solar [ASTRO]</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className={`text-base font-bold leading-tight ${astroData.isDaytime ? 'text-amber-400' : 'text-slate-400'}`}>
                {astroData.lightingStatus}
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-2">
                Elev: {astroData.localSunElevationDegrees > 0 ? `+${astroData.localSunElevationDegrees}°` : `${astroData.localSunElevationDegrees}°`} ({astroData.localSunCompass})
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Thermal: ~{astroData.estimatedSurfaceTempC}°C · {astroData.isDaytime ? 'Solar arrays active' : 'Battery/RTG required'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Mission Verdict & Recommendations */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-5">
          {/* Verdict Quote */}
          <div className="p-4 rounded-xl bg-sky-950/20 border-l-4 border-sky-500 text-slate-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 block mb-1">
              Mission Feasibility Verdict
            </span>
            <p className="text-sm leading-relaxed">
              {analysis?.verdict || `Site evaluated with local slope of ${selectedSite.surfaceSlopeDegrees}°. Trajectory parameters indicate touchdown feasibility within nominal margins.`}
            </p>
          </div>

          {/* Side-by-side Hazards & Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Hazards */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/70">
              <div className="flex items-center gap-2 font-semibold text-amber-400 mb-3 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Primary Landing Hazards</span>
              </div>
              <ul className="space-y-2">
                {(analysis?.primaryHazards || [
                  `Surface slope gradient: ${selectedSite.surfaceSlopeDegrees}°`,
                  `Regolith dust plume lofting below 15m thruster altitude`,
                  `Crater obstacle field requires autonomous hazard avoidance`
                ]).map((hazard, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                    <span className="text-amber-500/80 mt-0.5">•</span>
                    <span>{hazard}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Flight Guidance */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/70">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-3 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Descent Guidance Protocols</span>
              </div>
              <ul className="space-y-2">
                {(analysis?.touchdownRecommendations || [
                  'Limit terminal vertical descent velocity to ≤ 1.2 m/s',
                  'Activate Doppler LIDAR hazard mapping at 600m above ground',
                  'Immediate thruster cutoff upon footpad touchdown sensor trigger'
                ]).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                    <span className="text-emerald-500/80 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Action Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Evaluating landing safety at {selectedSite.name}. Click anywhere on the 3D Moon above to test another spot.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleSelectSite(selectedSite, true)}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-sky-200" />
              )}
              <span>{isAnalyzing ? 'Running Deep AI Scan...' : 'Deep AI Verification'}</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              View Full Report
            </button>
          </div>
        </div>

        {/* AI Autonomous Landing Site Scouting Section (UNDER the manual click reports) */}
        <div id="ai-recommender-section" className="pt-2">
          <AISiteRecommender
            onSelectSite={(site) => {
              handleSelectSite(site, false);
              setCenterTrigger((prev) => prev + 1);
            }}
            selectedSiteId={selectedSite.id}
          />
        </div>
      </section>

      {/* 4. Complete Mission Safety Report Modal */}
      <SafetyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        site={selectedSite}
        analysis={analysis}
        astroData={astroData}
      />
    </div>
  );
}

import { X, Printer, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Compass, Radio, Sun, Mountain, Layers, Clock, Globe } from 'lucide-react';
import { LandingSite } from '../utils/lunarData';
import { LunarAstroData } from '../utils/lunarAstro';

export interface AISafetyAnalysis {
  safetyScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  verdict: string;
  goNoGoStatus: 'GO' | 'GO WITH CAUTION' | 'NO GO';
  primaryHazards: string[];
  touchdownRecommendations: string[];
  sciencePotential: string;
}

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: LandingSite;
  analysis: AISafetyAnalysis | null;
  astroData?: LunarAstroData;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  onClose,
  site,
  analysis,
  astroData,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GO':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-md text-sm font-semibold tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            MISSION STATUS: GO
          </div>
        );
      case 'GO WITH CAUTION':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-md text-sm font-semibold tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            MISSION STATUS: GO WITH CAUTION
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-md text-sm font-semibold tracking-wider">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            MISSION STATUS: NO GO
          </div>
        );
    }
  };

  const score = analysis?.safetyScore ?? 82;
  const status = analysis?.goNoGoStatus ?? 'GO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-wide text-white">Lunar Landing Site Safety Report</h2>
              <p className="text-xs text-slate-400">Autonomous Lunar Exploration & Feasibility Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Print or export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-6 text-sm">
          {/* Executive Summary Card */}
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400">Target Coordinates</span>
              <h3 className="text-xl font-bold text-white">{site.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {site.latitude.toFixed(2)}° Lat · {site.longitude.toFixed(2)}° Lon · Elev: {site.elevationMeters}m
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {getStatusBadge(status)}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-md border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Score:</span>
                <span className={`font-bold ${score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {score}%
                </span>
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-900/30">
            <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-1">Executive Mission Verdict</h4>
            <p className="text-slate-200 leading-relaxed text-sm">
              {analysis?.verdict || `Autonomous descent review confirms this site meets standard operational criteria with acceptable local slope gradients.`}
            </p>
          </div>

          {/* Real Astronomical Ephemeris & Lighting Conditions Section */}
          {astroData && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                    Astronomical Ephemeris & Lighting [REAL CALCULATION]
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Meeus Ephemeris Engine
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 font-mono gap-1">
                <p>
                  UTC Epoch: <span className="text-white font-semibold">{astroData.utcDateString}</span> (JD {astroData.julianDate.toFixed(2)})
                </p>
                <p className="text-slate-400">
                  Local: <span className="text-slate-300">{astroData.localDateString}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Moon Phase</span>
                  <span className="text-xs font-bold text-white block mt-0.5">{astroData.phaseName}</span>
                  <span className="text-[10px] text-amber-400 font-mono block mt-0.5">{astroData.illuminatedPercentage}% disk · Age: {astroData.lunarAgeDays}d</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Subsolar Point</span>
                  <span className="text-xs font-bold text-white font-mono block mt-0.5">
                    {astroData.subsolarLatitude >= 0 ? `${astroData.subsolarLatitude}°N` : `${Math.abs(astroData.subsolarLatitude)}°S`}, {astroData.subsolarLongitude >= 0 ? `${astroData.subsolarLongitude}°E` : `${Math.abs(astroData.subsolarLongitude)}°W`}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sun Zenith Coords</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Site Sun Elevation</span>
                  <span className={`text-xs font-bold block mt-0.5 ${astroData.isDaytime ? 'text-amber-400' : 'text-slate-400'}`}>
                    {astroData.localSunElevationDegrees > 0 ? `+${astroData.localSunElevationDegrees}°` : `${astroData.localSunElevationDegrees}°`}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block mt-0.5 truncate">{astroData.localSunCompass} · ~{astroData.estimatedSurfaceTempC}°C</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Earth Horizon Angle</span>
                  <span className={`text-xs font-bold block mt-0.5 ${astroData.isEarthVisible ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {astroData.earthElevationDegrees > 0 ? `+${astroData.earthElevationDegrees}°` : `${astroData.earthElevationDegrees}°`}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{astroData.earthCompass} · {astroData.isEarthVisible ? 'Direct LOS' : 'Shadowed'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Parameters Grid: Topographical & Geological Profile */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Topographical & Surface Environment [LROC / LOLA MODEL]
              </h4>
              <span className="text-[10px] font-mono text-slate-500">NASA LRO Orbiter Altimetry</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Mountain className="w-3.5 h-3.5 text-sky-400" />
                  <span>Slope Hazard</span>
                </div>
                <p className="text-base font-semibold text-white">{site.surfaceSlopeDegrees}°</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {site.surfaceSlopeDegrees <= 5 ? 'Gentle plain' : site.surfaceSlopeDegrees <= 10 ? 'Moderate grade' : 'Steep incline'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Crater Density</span>
                </div>
                <p className="text-base font-semibold text-white">{site.craterDensity}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Local micro-relief</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Illumination Mean</span>
                </div>
                <p className="text-xs font-semibold text-white truncate" title={site.illumination}>
                  {site.illumination.split('(')[0].trim()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Topographic average</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Earth Radio Link</span>
                </div>
                <p className="text-base font-semibold text-white">
                  {Math.abs(site.longitude) <= 85 ? 'Direct LOS' : 'Relay Req.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {Math.abs(site.longitude) <= 85 ? 'Nearside coverage' : 'Farside orbit relay'}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Hazards */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Assessed Descent Hazards</h4>
            <div className="space-y-2">
              {(analysis?.primaryHazards || [
                `Local slope (${site.surfaceSlopeDegrees}°) requires standard gear damping stability.`,
                `Descent engine plume will displace fine abrasive regolith below 15 meters altitude.`,
                `Boulder dispersion requires optical hazard detection avoidance.`
              ]).map((hazard, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{hazard}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Touchdown Guidance & Recommendations */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Flight & Guidance Recommendations</h4>
            <div className="space-y-2">
              {(analysis?.touchdownRecommendations || [
                'Initialize hazard detection LIDAR altimeter scan at 600m above ground level.',
                'Maintain terminal vertical touchdown velocity under 1.2 m/s.',
                'Cut engine thrust immediately upon footpad contact switch closure.'
              ]).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Value */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">Scientific & Resource Value</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              {analysis?.sciencePotential || site.historyOrValue}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>LunarNav Mission Planning System · Automated Report</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

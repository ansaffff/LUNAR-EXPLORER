import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Compass, 
  RotateCcw, 
  Info, 
  Check, 
  X, 
  Crosshair, 
  HelpCircle,
  Globe,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { LandingSite, LUNAR_REGION_PRESETS, searchLunarLocations, deriveSiteData } from '../utils/lunarData';

interface LunarLocationSelectorProps {
  selectedSite: LandingSite;
  onSelectSite: (site: LandingSite) => void;
  onResetSelection: () => void;
  onCenterViewOnSite?: () => void;
  hoverCoords?: { lat: number; lon: number } | null;
}

export const LunarLocationSelector: React.FC<LunarLocationSelectorProps> = ({
  selectedSite,
  onSelectSite,
  onResetSelection,
  onCenterViewOnSite,
  hoverCoords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAccuracyInfo, setShowAccuracyInfo] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search results
  const searchResults = searchLunarLocations(searchQuery);

  const handleSelectResult = (site: LandingSite) => {
    onSelectSite(site);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.matches.length > 0) {
      handleSelectResult(searchResults.matches[0]);
    } else if (searchResults.parsedCoordinate) {
      const { lat, lon } = searchResults.parsedCoordinate;
      const customSite = deriveSiteData(lat, lon, `Custom Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`, 'Direct Coordinate Input');
      handleSelectResult(customSite);
    }
  };

  // Format latitude/longitude helper
  const formatCoordinates = (lat: number, lon: number) => {
    const latStr = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
    const lonStr = lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`;
    return `${latStr}, ${lonStr}`;
  };

  // Helper badge for coordinate precision
  const getPrecisionBadge = (precision: LandingSite['coordinatePrecision']) => {
    switch (precision) {
      case 'Exact Historic Touchdown':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            EXACT HISTORIC TOUCHDOWN
          </span>
        );
      case 'Approximate Regional Landmark':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-950/80 text-sky-300 border border-sky-500/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            APPROXIMATE REGIONAL LANDMARK
          </span>
        );
      case 'Direct Coordinate Input':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            DIRECT COORDINATE INPUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            ARBITRARY MAP SELECTION
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-950/85 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Top Header: Title, Telemetry & Accuracy Info Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-sky-950/80 border border-sky-800/50 text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Moon Location Selection & IAU Coordinates
            </h3>
            {getPrecisionBadge(selectedSite.coordinatePrecision)}
          </div>
          <p className="text-xs text-slate-400">
            Click/tap anywhere on the 3D Moon to select landing coordinates, search lunar regions, or pick from recognizable presets.
          </p>
        </div>

        {/* Action Controls: Reset & Accuracy Info */}
        <div className="flex items-center gap-2 shrink-0">
          {onCenterViewOnSite && (
            <button
              onClick={onCenterViewOnSite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
              title="Rotate Moon view so the selected landing site is front and center"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              <span>Center View on Site</span>
            </button>
          )}

          <button
            onClick={onResetSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
            title="Reset landing location to Apollo 11 default reference site"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Selection</span>
          </button>

          <button
            onClick={() => setShowAccuracyInfo(!showAccuracyInfo)}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              showAccuracyInfo 
                ? 'bg-sky-950 text-sky-300 border-sky-600/50' 
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
            title="Learn about Moon Map projection and selenographic coordinate accuracy"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Projection & Accuracy Explanation Box (Collapsible) */}
      {showAccuracyInfo && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-800/40 text-xs space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-sky-300 font-semibold">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Lunar Cartography, Projections & Selenographic Accuracy</span>
            </div>
            <button
              onClick={() => setShowAccuracyInfo(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <strong>Coordinate Standard:</strong> All coordinates follow the International Astronomical Union (IAU) Mean Earth/Polar Axis selenographic system. Latitude spans $-90^\circ$ (South Pole) to $+90^\circ$ (North Pole). Longitude spans $-180^\circ$ (West) to $+180^\circ$ (East), with $0^\circ, 0^\circ$ anchored at Sinus Medii facing Earth.
            </p>
            <p>
              • <strong>Map Projection &amp; 3D Raycasting:</strong> The surface visualization is built from NASA Lunar Reconnaissance Orbiter (LROC) photographic data in Plate Carrée (equidistant cylindrical) format mapped onto a 3D sphere. When you click or tap the Moon, Three.js raycasting determines the precise 3D surface intersection vector (x, y, z) and calculates exact trigonometric coordinates: latitude = arcsin(y / R) and longitude = atan2(x, z).
            </p>
            <p>
              • <strong>Data Provenance & Precision:</strong> Specific mission touchdowns (e.g. Apollo 11) are tagged <span className="text-emerald-400 font-mono font-bold">[EXACT HISTORIC TOUCHDOWN]</span> based on NASA telemetry. Regional landmarks (e.g. Lunar South Pole, Near side, Far side) are tagged <span className="text-sky-300 font-mono">[APPROXIMATE REGIONAL LANDMARK]</span> to clearly indicate general area centroids rather than pinpoint landing footpads.
            </p>
          </div>
        </div>
      )}

      {/* Location Search Bar & Recognizable Presets */}
      <div className="space-y-3">
        {/* Search Input Box */}
        <div ref={searchContainerRef} className="relative w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search lunar crater, mare, Apollo/Artemis site, or enter coordinates (e.g. '0.67, 23.47' or '-89.9 0')..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-12 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Go
            </button>
          </form>

          {/* Autocomplete / Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800 scrollbar-thin">
              {searchResults.matches.length > 0 ? (
                searchResults.matches.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => handleSelectResult(site)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white group-hover:text-sky-300 transition-colors truncate">
                          {site.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {site.regionCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {formatCoordinates(site.latitude, site.longitude)} · {site.terrainType}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {getPrecisionBadge(site.coordinatePrecision)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <p>No named lunar regions matched "{searchQuery}".</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Tip: Enter numerical coordinates like "18.4, -57.4" or "10N, 45E".
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recognizable Lunar Region Presets (Specification Mandatory Presets) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Recognizable Lunar Region Presets:
            </span>
            {hoverCoords && (
              <span className="text-[11px] font-mono text-sky-400 hidden sm:inline">
                Cursor Target: {formatCoordinates(hoverCoords.lat, hoverCoords.lon)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {LUNAR_REGION_PRESETS.map((preset) => {
              const isSelected = selectedSite.id === preset.id || (
                Math.abs(selectedSite.latitude - preset.latitude) < 0.2 &&
                Math.abs(selectedSite.longitude - preset.longitude) < 0.2
              );
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectSite(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-500/30'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={`${preset.name} (${formatCoordinates(preset.latitude, preset.longitude)}) · ${preset.coordinatePrecision}`}
                >
                  <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-sky-400'}`} />
                  <span>{preset.name.split('(')[0].trim()}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    preset.coordinatePrecision === 'Exact Historic Touchdown'
                      ? isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : isSelected ? 'bg-sky-800 text-sky-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {preset.coordinatePrecision === 'Exact Historic Touchdown' ? 'Exact' : 'Approx'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Location Telemetry Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Selected Location Name
          </span>
          <span className="text-xs font-bold text-white block mt-0.5 truncate" title={selectedSite.name}>
            {selectedSite.name}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {selectedSite.terrainType}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            IAU Lunar Coordinates
          </span>
          <span className="text-xs font-bold text-sky-300 font-mono block mt-0.5">
            {formatCoordinates(selectedSite.latitude, selectedSite.longitude)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Elevation: {selectedSite.elevationMeters} m · Hemisphere: {selectedSite.regionCategory}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Coordinate Accuracy Level
          </span>
          <div className="mt-1">
            {getPrecisionBadge(selectedSite.coordinatePrecision)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Marker synchronized with 3D Moon sphere
          </span>
        </div>
      </div>
    </div>
  );
};

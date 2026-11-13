export interface LandingSite {
  id: string;
  name: string;
  type: 'Historic' | 'Artemis Candidate' | 'Scientific Target' | 'Highland' | 'Mare' | 'Regional Landmark';
  coordinatePrecision: 'Exact Historic Touchdown' | 'Exact Robotic Landing' | 'Approximate Regional Landmark' | 'Direct Coordinate Input' | 'Arbitrary Map Selection';
  regionCategory: 'Nearside' | 'Farside' | 'South Pole' | 'North Pole';
  latitude: number; // degrees (-90 to +90)
  longitude: number; // degrees (-180 to +180)
  elevationMeters: number;
  terrainType: string;
  surfaceSlopeDegrees: number;
  craterDensity: 'Low' | 'Moderate' | 'High' | 'Very High';
  boulderRisk: 'Low' | 'Moderate' | 'High';
  illumination: string;
  dustDensity: 'Low' | 'Moderate' | 'Elevated' | 'Extreme';
  description: string;
  historyOrValue: string;
}

// 1. Mandatory Recognizable Presets required by specification:
// - Lunar South Pole
// - Lunar North Pole
// - Near side of the Moon
// - Far side of the Moon
// - Sea of Tranquility (Mare Tranquillitatis)
export const LUNAR_REGION_PRESETS: LandingSite[] = [
  {
    id: 'mare-tranquillitatis',
    name: 'Sea of Tranquility (Mare Tranquillitatis)',
    type: 'Historic',
    coordinatePrecision: 'Exact Historic Touchdown',
    regionCategory: 'Nearside',
    latitude: 0.67,
    longitude: 23.47,
    elevationMeters: -1800,
    terrainType: 'Flat Basaltic Sea (Mare)',
    surfaceSlopeDegrees: 2.1,
    craterDensity: 'Low',
    boulderRisk: 'Low',
    illumination: '14-Day Lunar Day/Night Cycle',
    dustDensity: 'Moderate',
    description: 'Apollo 11 touchdown location ("Statio Tranquillitatis"). Vast, stable volcanic basalt plain with minimal obstacles.',
    historyOrValue: 'Exact historic site of humanity\'s first crewed extraterrestrial landing (July 20, 1969). Rich in titanium basalts.'
  },
  {
    id: 'lunar-south-pole',
    name: 'Lunar South Pole (Shackleton Rim)',
    type: 'Artemis Candidate',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'South Pole',
    latitude: -89.9,
    longitude: 0.0,
    elevationMeters: 1250,
    terrainType: 'South Polar Cratered Rim',
    surfaceSlopeDegrees: 8.4,
    craterDensity: 'High',
    boulderRisk: 'Moderate',
    illumination: '86% Annual Solar Visibility (Rim)',
    dustDensity: 'Elevated',
    description: 'Premier candidate region for the Artemis Base Camp on the high rim of Shackleton Crater near the true lunar South Pole.',
    historyOrValue: 'Permanent cold traps preserve volatile water ice reserves essential for life support and rocket propellant.'
  },
  {
    id: 'lunar-north-pole',
    name: 'Lunar North Pole (Peary Crater Region)',
    type: 'Regional Landmark',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'North Pole',
    latitude: 89.9,
    longitude: 0.0,
    elevationMeters: 1600,
    terrainType: 'North Polar Impact Ridge',
    surfaceSlopeDegrees: 6.2,
    craterDensity: 'High',
    boulderRisk: 'Moderate',
    illumination: 'Quasi-Continuous Low Grazing Sunlight',
    dustDensity: 'Moderate',
    description: 'High-latitude northern polar region featuring elevated plateaus with extended illumination periods opposite the South Pole.',
    historyOrValue: 'Scientific observation target for long-baseline polar interferometry and low-temperature regolith samples.'
  },
  {
    id: 'near-side-moon',
    name: 'Near side of the Moon (Sinus Medii)',
    type: 'Regional Landmark',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'Nearside',
    latitude: 0.0,
    longitude: 0.0,
    elevationMeters: -1400,
    terrainType: 'Central Meridian Nearside Lowland',
    surfaceSlopeDegrees: 2.4,
    craterDensity: 'Low',
    boulderRisk: 'Low',
    illumination: '14-Day Solar Cycle',
    dustDensity: 'Moderate',
    description: 'Center of the visible lunar disk facing Earth (Mean Sub-Earth Point). Prime Meridian of IAU selenographic coordinates.',
    historyOrValue: 'Earth is permanently fixed directly overhead at the zenith (+90° elevation), providing maximum direct telecommunications bandwidth.'
  },
  {
    id: 'far-side-moon',
    name: 'Far side of the Moon (Daedalus Highlands)',
    type: 'Regional Landmark',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'Farside',
    latitude: 0.0,
    longitude: 180.0,
    elevationMeters: 3600,
    terrainType: 'Rugged Farside Anorthositic Highlands',
    surfaceSlopeDegrees: 9.8,
    craterDensity: 'Very High',
    boulderRisk: 'High',
    illumination: '14-Day Solar Cycle (Opposite Phase)',
    dustDensity: 'Elevated',
    description: 'Center of the lunar Farside hemisphere opposite Earth. Permanently shielded from all terrestrial radio noise.',
    historyOrValue: 'Premier location for future deep-space radio telescopes and cosmological 21-cm dark ages radiation observatories.'
  },
  {
    id: 'oceanus-procellarum',
    name: 'Ocean of Storms (Oceanus Procellarum)',
    type: 'Mare',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'Nearside',
    latitude: 18.4,
    longitude: -57.4,
    elevationMeters: -2100,
    terrainType: 'Vast Mare Plain',
    surfaceSlopeDegrees: 1.8,
    craterDensity: 'Low',
    boulderRisk: 'Low',
    illumination: '14-Day Solar Cycle',
    dustDensity: 'Moderate',
    description: 'The largest lunar mare, spanning over 2,500 km. Exceptionally flat with minimal touchdown hazard.',
    historyOrValue: 'Visited by Apollo 12 and Chang\'e 5. Houses some of the youngest volcanic basalt formations on the Moon.'
  },
  {
    id: 'tycho-crater',
    name: 'Tycho Crater Rim',
    type: 'Scientific Target',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'Nearside',
    latitude: -43.3,
    longitude: -11.2,
    elevationMeters: 2200,
    terrainType: 'Impact Rim & High-Albedo Rays',
    surfaceSlopeDegrees: 14.5,
    craterDensity: 'Very High',
    boulderRisk: 'High',
    illumination: '14-Day Solar Cycle',
    dustDensity: 'Extreme',
    description: 'Prominent 85km-wide impact crater featuring spectacular bright ray systems radiating across thousands of kilometers.',
    historyOrValue: 'Formed ~108 million years ago. Contains pristine impact melt and deep crustal excavated materials.'
  },
  {
    id: 'malapert-mountain',
    name: 'Malapert Mountain (Massif)',
    type: 'Artemis Candidate',
    coordinatePrecision: 'Approximate Regional Landmark',
    regionCategory: 'South Pole',
    latitude: -84.9,
    longitude: 12.9,
    elevationMeters: 4800,
    terrainType: 'Highland Massif / Plateau',
    surfaceSlopeDegrees: 6.8,
    craterDensity: 'Moderate',
    boulderRisk: 'Moderate',
    illumination: '93% Quasi-Continuous Sun',
    dustDensity: 'Moderate',
    description: 'High-elevation summit near the South Pole offering nearly unbroken solar power and uninterrupted line-of-sight to Earth.',
    historyOrValue: 'Prime location for future lunar communications relay stations and continuous solar array installations.'
  },
  {
    id: 'fra-mauro',
    name: 'Fra Mauro Formation',
    type: 'Highland',
    coordinatePrecision: 'Exact Historic Touchdown',
    regionCategory: 'Nearside',
    latitude: -3.65,
    longitude: -17.48,
    elevationMeters: -450,
    terrainType: 'Undulating Highland Ejecta',
    surfaceSlopeDegrees: 4.8,
    craterDensity: 'Moderate',
    boulderRisk: 'Moderate',
    illumination: '14-Day Solar Cycle',
    dustDensity: 'Elevated',
    description: 'Hilly highland formation consisting of ejecta blanket thrown outward from the ancient Imbrium impact basin.',
    historyOrValue: 'Apollo 14 landing site (Alan Shepard & Edgar Mitchell). Key to calibrating lunar geological epochs.'
  }
];

export const CURATED_LANDING_SITES = LUNAR_REGION_PRESETS;

// Calculate realistic terrain and environmental metrics for any arbitrary Lat/Lon clicked or selected on the Moon
export function deriveSiteData(lat: number, lon: number, customLabel?: string, precision?: LandingSite['coordinatePrecision']): LandingSite {
  // Normalize lon to -180 to 180
  let normLon = ((lon + 180) % 360) - 180;
  if (normLon < -180) normLon += 360;

  // Check if near any curated/preset site
  for (const site of LUNAR_REGION_PRESETS) {
    const dLat = Math.abs(site.latitude - lat);
    const dLon = Math.abs(site.longitude - normLon);
    if (dLat < 0.6 && dLon < 0.8) {
      return site;
    }
  }

  // Determine terrain characteristics from latitude and longitude
  const isSouthPolar = lat < -75;
  const isNorthPolar = lat > 75;
  const isFarside = Math.abs(normLon) > 90;

  // Approximate near-side maria locations
  const isNearMare =
    !isFarside &&
    ((lat > 10 && lat < 45 && normLon > -75 && normLon < -10) || // Imbrium / Procellarum
      (lat > 0 && lat < 35 && normLon > 10 && normLon < 45) || // Serenitatis / Tranquillitatis
      (lat > 10 && lat < 25 && normLon > 50 && normLon < 70) || // Crisium
      (lat < 5 && lat > -30 && normLon > -50 && normLon < 0)); // Nubium / Humorum

  let terrainType = 'Highland Terra (Anorthosite)';
  let slope = 7.5 + (Math.abs(Math.sin(lat * 0.1) * Math.cos(normLon * 0.1)) * 6.5);
  let elevation = 1200 + Math.sin(lat * 0.2) * 1800;
  let craterDensity: LandingSite['craterDensity'] = 'High';
  let boulderRisk: LandingSite['boulderRisk'] = 'Moderate';
  let dustDensity: LandingSite['dustDensity'] = 'Moderate';

  if (isSouthPolar) {
    terrainType = 'South Polar Cratered Rim';
    slope = 7.0 + Math.abs(Math.cos(normLon)) * 5.0;
    elevation = 2100;
    craterDensity = 'Very High';
    boulderRisk = 'Moderate';
    dustDensity = 'Elevated';
  } else if (isNorthPolar) {
    terrainType = 'North Polar High-Latitude Terrain';
    slope = 6.2;
    elevation = 1600;
    craterDensity = 'High';
  } else if (isNearMare) {
    terrainType = 'Mare Basalt Plain (Lowland)';
    slope = 1.9 + (Math.abs(Math.sin(lat * 0.3)) * 2.2);
    elevation = -1800 + Math.cos(normLon * 0.2) * 400;
    craterDensity = 'Low';
    boulderRisk = 'Low';
    dustDensity = 'Moderate';
  } else if (isFarside) {
    terrainType = 'Farside Rugged Highlands';
    slope = 9.2 + Math.abs(Math.sin(normLon * 0.1)) * 5.0;
    elevation = 3200;
    craterDensity = 'Very High';
    boulderRisk = 'High';
    dustDensity = 'Elevated';
  }

  // Format naming
  const latDir = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
  const lonDir = normLon >= 0 ? `${normLon.toFixed(2)}°E` : `${Math.abs(normLon).toFixed(2)}°W`;
  const regionTag = isSouthPolar
    ? 'Lunar South Polar Region'
    : isNorthPolar
    ? 'Lunar North Polar Region'
    : isNearMare
    ? 'Nearside Lunar Mare'
    : isFarside
    ? 'Lunar Farside Highland'
    : 'Lunar Highland Basin';

  const illumination = isSouthPolar
    ? 'Low Grazing Solar Angle (Deep Rim Shadows)'
    : isNorthPolar
    ? 'Low Grazing Sunlight'
    : '14-Day Solar Cycle (354 hrs day / 354 hrs night)';

  const assignedPrecision: LandingSite['coordinatePrecision'] = precision || 'Arbitrary Map Selection';
  const siteName = customLabel || `${regionTag} (${latDir}, ${lonDir})`;

  return {
    id: `custom-${lat.toFixed(2)}-${normLon.toFixed(2)}`,
    name: siteName,
    type: isNearMare ? 'Mare' : 'Highland',
    coordinatePrecision: assignedPrecision,
    regionCategory: isSouthPolar ? 'South Pole' : isNorthPolar ? 'North Pole' : isFarside ? 'Farside' : 'Nearside',
    latitude: Number(lat.toFixed(2)),
    longitude: Number(normLon.toFixed(2)),
    elevationMeters: Math.round(elevation),
    terrainType,
    surfaceSlopeDegrees: Number(slope.toFixed(1)),
    craterDensity,
    boulderRisk,
    illumination,
    dustDensity,
    description: `Selected location at ${latDir}, ${lonDir} on the ${regionTag.toLowerCase()}. Surface composed of pulverized lunar regolith with ${craterDensity.toLowerCase()} impact crater density.`,
    historyOrValue: isFarside
      ? 'Farside radio-quiet zone ideal for deep space low-frequency radio astronomy.'
      : isSouthPolar
      ? 'Strategic Artemis landing candidate with cryogenic volatiles and extended solar peaks.'
      : 'Solid baseline site for automated geophysical station deployment.'
  };
}

// Location search parser: parses names or coordinates
export function searchLunarLocations(query: string): { matches: LandingSite[]; parsedCoordinate?: { lat: number; lon: number } } {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { matches: LUNAR_REGION_PRESETS };
  }

  // 1. Check for coordinate pattern like "0.67, 23.47", "-89.9 0", "15S, 45W", "0.67N, 23.47E"
  const coordRegex = /^(-?\d+(?:\.\d+)?)\s*([nsew])?\s*[,/ ]\s*(-?\d+(?:\.\d+)?)\s*([nsew])?$/i;
  const match = trimmed.match(coordRegex);
  if (match) {
    let lat = parseFloat(match[1]);
    let lon = parseFloat(match[3]);
    const dir1 = match[2]?.toLowerCase();
    const dir2 = match[4]?.toLowerCase();

    if (dir1 === 's') lat = -Math.abs(lat);
    if (dir1 === 'n') lat = Math.abs(lat);
    if (dir1 === 'w') lon = -Math.abs(lon);
    if (dir1 === 'e') lon = Math.abs(lon);

    if (dir2 === 's') lat = -Math.abs(lat);
    if (dir2 === 'n') lat = Math.abs(lat);
    if (dir2 === 'w') lon = -Math.abs(lon);
    if (dir2 === 'e') lon = Math.abs(lon);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const customSite = deriveSiteData(lat, lon, `Custom Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`, 'Direct Coordinate Input');
      return {
        matches: [customSite, ...LUNAR_REGION_PRESETS.filter(p => p.id === 'mare-tranquillitatis')],
        parsedCoordinate: { lat, lon }
      };
    }
  }

  // 2. Keyword text search across presets
  const filtered = LUNAR_REGION_PRESETS.filter((site) => {
    return (
      site.name.toLowerCase().includes(trimmed) ||
      site.terrainType.toLowerCase().includes(trimmed) ||
      site.regionCategory.toLowerCase().includes(trimmed) ||
      site.description.toLowerCase().includes(trimmed) ||
      site.historyOrValue.toLowerCase().includes(trimmed)
    );
  });

  return { matches: filtered };
}

export function computeInstantAnalysis(site: LandingSite) {
  const slope = site.surfaceSlopeDegrees;
  const isPolar = Math.abs(site.latitude) > 75;
  const isFarside = Math.abs(site.longitude) > 85;

  let baseScore = 93;
  if (slope > 14) baseScore -= 36;
  else if (slope > 9) baseScore -= 22;
  else if (slope > 5) baseScore -= 10;

  if (site.boulderRisk === 'High') baseScore -= 16;
  else if (site.boulderRisk === 'Moderate') baseScore -= 6;

  if (site.craterDensity === 'Very High') baseScore -= 14;
  else if (site.craterDensity === 'High') baseScore -= 8;

  if (isPolar) baseScore -= 6;
  if (isFarside) baseScore -= 8;

  baseScore = Math.max(28, Math.min(97, Math.round(baseScore)));

  const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' =
    baseScore >= 80 ? 'LOW' : baseScore >= 65 ? 'MODERATE' : 'HIGH';
  const goNoGoStatus: 'GO' | 'GO WITH CAUTION' | 'NO GO' =
    baseScore >= 78 ? 'GO' : baseScore >= 60 ? 'GO WITH CAUTION' : 'NO GO';

  const hazards = [
    slope > 8
      ? `Local surface slope of ${slope}° requires active landing gear damping.`
      : `Gentle terrain slope (${slope}°) is well within nominal 15° lander stability margins.`,
    isPolar
      ? `Low solar elevation angle produces extended shadows, affecting optical navigation.`
      : isFarside
      ? `Farside position blocks direct Earth line-of-sight; requires dedicated orbital relay.`
      : `Direct line-of-sight ensures uninterrupted telemetry link to Earth ground stations.`,
    `Terminal descent thruster plumes will loft abrasive regolith dust below 15 meters altitude.`,
    site.boulderRisk === 'High'
      ? `Elevated boulder field density requires autonomous optical obstacle detection diverts.`
      : `Low rock dispersion profile reduces landing footpad puncture hazard.`
  ];

  const recommendations = [
    'Initialize Doppler LIDAR terrain mapping at 600m above ground level.',
    `Limit terminal vertical touchdown velocity to ≤ ${slope > 8 ? '1.0' : '1.2'} m/s.`,
    'Execute autonomous thruster cutoff within 50ms of footpad ground switch trip.'
  ];

  const verdict =
    goNoGoStatus === 'GO'
      ? `Flight trajectory to ${site.name} exhibits favorable conditions with an estimated safety rating of ${baseScore}%. Local slope (${slope}°) is nominal for touchdown.`
      : goNoGoStatus === 'GO WITH CAUTION'
      ? `Touchdown at ${site.name} is feasible with caution (${baseScore}% rating). Elevated local terrain slope (${slope}°) requires active hazard detection avoidance.`
      : `High-risk landing candidate (${baseScore}% rating) due to rugged topography and a ${slope}° slope gradient exceeding standard nominal limits.`;

  return {
    safetyScore: baseScore,
    riskLevel,
    verdict,
    goNoGoStatus,
    primaryHazards: hazards,
    touchdownRecommendations: recommendations,
    sciencePotential: site.historyOrValue
  };
}

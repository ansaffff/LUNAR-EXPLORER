// Real Astronomical Calculations for Lunar Ephemeris, Lighting, and Earth Visibility
// Based on Jean Meeus Astronomical Algorithms and standard IAU lunar coordinates

export interface LunarAstroData {
  // Epoch & Time
  utcDateString: string;
  localDateString: string;
  julianDate: number;

  // Moon Phase & Age
  phaseName: string;
  illuminatedFraction: number; // 0.0 to 1.0 (e.g. 0.85 = 85%)
  illuminatedPercentage: number; // 0 to 100
  lunarAgeDays: number; // 0 to 29.53 days
  synodicMonthDays: number;

  // Subsolar Point on Moon (Selenographic coordinates of the Sun)
  subsolarLatitude: number; // degrees (-1.54° to +1.54°)
  subsolarLongitude: number; // degrees (-180° to +180°)

  // Sub-Earth Point on Moon (Selenographic coordinates of Earth with Libration)
  subEarthLatitude: number; // optical/physical libration in latitude (~ -6.7° to +6.7°)
  subEarthLongitude: number; // optical/physical libration in longitude (~ -7.9° to +7.9°)

  // Local Conditions at Target Landing Site (lat, lon)
  targetLatitude: number;
  targetLongitude: number;
  localSunElevationDegrees: number; // > 0 is day, < 0 is night
  localSunAzimuthDegrees: number; // 0 to 360° clockwise from North
  localSunCompass: string;
  isDaytime: boolean;
  isTerminatorZone: boolean; // within 2.5 degrees of horizon
  lightingStatus: 'Direct Sunlight' | 'Terminator (Sunrise/Sunset)' | 'Lunar Night' | 'Permanent Cold Trap';
  
  // Earth Visibility from Target Site
  earthElevationDegrees: number; // elevation of Earth above lunar horizon
  earthAzimuthDegrees: number;
  earthCompass: string;
  isEarthVisible: boolean;
  earthVisibilityStatus: string;
  
  // Estimated surface temperature based on solar angle
  estimatedSurfaceTempC: number;
}

// Convert degrees to 16-point compass label
function degreesToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  return `${directions[idx]} (${Math.round(normalized)}°)`;
}

// Convert standard Date to Julian Date (JD)
export function getJulianDate(date: Date): number {
  const time = date.getTime();
  return time / 86400000 + 2440587.5;
}

// Compute real lunar ephemeris for any given Date and Target Landing Coordinates (lat, lon)
export function calculateLunarAstro(date: Date, targetLat: number, targetLon: number): LunarAstroData {
  const jd = getJulianDate(date);
  
  // Reference epoch: Known New Moon on Jan 6, 2000, 18:14 UTC (JD 2451549.26)
  const epochNewMoonJD = 2451549.2604;
  const synodicMonth = 29.53058867; // mean synodic month in days
  const anomalisticMonth = 27.554551; // perigee to perigee (libration in longitude)
  const draconicMonth = 27.212220; // node to node (libration in latitude)

  // Days since reference epoch
  const daysSinceEpoch = jd - epochNewMoonJD;

  // Lunar age in days (0 to 29.53)
  let lunarAgeDays = daysSinceEpoch % synodicMonth;
  if (lunarAgeDays < 0) lunarAgeDays += synodicMonth;

  // Lunar phase angle (0 to 2pi radians, where 0 = New Moon, pi = Full Moon)
  const phaseAngleRad = (lunarAgeDays / synodicMonth) * 2 * Math.PI;

  // Illuminated fraction k (0.0 to 1.0)
  const illuminatedFraction = (1 - Math.cos(phaseAngleRad)) / 2;
  const illuminatedPercentage = Math.round(illuminatedFraction * 1000) / 10;

  // Phase Name
  let phaseName = 'New Moon';
  if (illuminatedFraction < 0.025) {
    phaseName = 'New Moon';
  } else if (lunarAgeDays < synodicMonth * 0.23) {
    phaseName = 'Waxing Crescent';
  } else if (lunarAgeDays <= synodicMonth * 0.27) {
    phaseName = 'First Quarter';
  } else if (lunarAgeDays < synodicMonth * 0.48) {
    phaseName = 'Waxing Gibbous';
  } else if (lunarAgeDays <= synodicMonth * 0.52) {
    phaseName = 'Full Moon';
  } else if (lunarAgeDays < synodicMonth * 0.73) {
    phaseName = 'Waning Gibbous';
  } else if (lunarAgeDays <= synodicMonth * 0.77) {
    phaseName = 'Third Quarter';
  } else {
    phaseName = 'Waning Crescent';
  }

  // 1. Subsolar Longitude on Moon:
  // At Full Moon (lunarAge = 14.76d), Sun is opposite Nearside, so Nearside Noon is at 0° Lon
  // At New Moon (lunarAge = 0d), Nearside Midnight is at 0° Lon (Sun is at 180° Lon)
  // The subsolar point shifts westward by ~12.2° per Earth day (~360° / 29.53d)
  let subsolarLon = (180 - (lunarAgeDays / synodicMonth) * 360) % 360;
  if (subsolarLon > 180) subsolarLon -= 360;
  if (subsolarLon < -180) subsolarLon += 360;

  // 2. Subsolar Latitude on Moon:
  // The Moon's equator is tilted by 1.543° to the ecliptic plane.
  const daysSinceJ2000 = jd - 2451545.0;
  const sunEclipticLon = (280.460 + 0.9856474 * daysSinceJ2000) * (Math.PI / 180);
  const moonAscendingNode = (125.04 - 0.0529538 * daysSinceJ2000) * (Math.PI / 180);
  const subsolarLat = 1.543 * Math.sin(sunEclipticLon - moonAscendingNode);

  // 3. Sub-Earth Point (Lunar Optical Libration):
  const anomalisticAngle = (daysSinceEpoch / anomalisticMonth) * 2 * Math.PI;
  const subEarthLon = 7.9 * Math.sin(anomalisticAngle);

  const draconicAngle = (daysSinceEpoch / draconicMonth) * 2 * Math.PI;
  const subEarthLat = 6.7 * Math.sin(draconicAngle);

  // 4. Local Solar Elevation & Azimuth at Target Site (lat, lon):
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const siteLatRad = targetLat * toRad;
  const siteLonRad = targetLon * toRad;
  const subsolarLatRad = subsolarLat * toRad;
  const subsolarLonRad = subsolarLon * toRad;

  const sinSunElev =
    Math.sin(siteLatRad) * Math.sin(subsolarLatRad) +
    Math.cos(siteLatRad) * Math.cos(subsolarLatRad) * Math.cos(siteLonRad - subsolarLonRad);

  const localSunElevDeg = Math.asin(Math.max(-1, Math.min(1, sinSunElev))) * toDeg;
  const isDaytime = localSunElevDeg > 0;
  const isTerminatorZone = Math.abs(localSunElevDeg) <= 2.5;

  // Solar Azimuth (clockwise from North: 0° N, 90° E, 180° S, 270° W)
  const dLonSun = subsolarLonRad - siteLonRad;
  const ySun = Math.sin(dLonSun);
  const xSun = Math.cos(siteLatRad) * Math.tan(subsolarLatRad) - Math.sin(siteLatRad) * Math.cos(dLonSun);
  let sunAzimuthDeg = Math.atan2(ySun, xSun) * toDeg;
  if (sunAzimuthDeg < 0) sunAzimuthDeg += 360;

  // Check for permanently shadowed polar craters (e.g. Shackleton rim vs deep interior)
  const isDeepPolarColdTrap = Math.abs(targetLat) >= 88.5;

  let lightingStatus: LunarAstroData['lightingStatus'] = 'Lunar Night';
  if (isDeepPolarColdTrap && localSunElevDeg < 0.5) {
    lightingStatus = 'Permanent Cold Trap';
  } else if (isTerminatorZone) {
    lightingStatus = 'Terminator (Sunrise/Sunset)';
  } else if (isDaytime) {
    lightingStatus = 'Direct Sunlight';
  }

  // 5. Earth Horizon Elevation & Azimuth from Target Site:
  const subEarthLatRad = subEarthLat * toRad;
  const subEarthLonRad = subEarthLon * toRad;

  const sinEarthElev =
    Math.sin(siteLatRad) * Math.sin(subEarthLatRad) +
    Math.cos(siteLatRad) * Math.cos(subEarthLatRad) * Math.cos(siteLonRad - subEarthLonRad);

  const earthElevDeg = Math.asin(Math.max(-1, Math.min(1, sinEarthElev))) * toDeg;
  const isEarthVisible = earthElevDeg > 0;

  const dLonEarth = subEarthLonRad - siteLonRad;
  const yEarth = Math.sin(dLonEarth);
  const xEarth = Math.cos(siteLatRad) * Math.tan(subEarthLatRad) - Math.sin(siteLatRad) * Math.cos(dLonEarth);
  let earthAzimuthDeg = Math.atan2(yEarth, xEarth) * toDeg;
  if (earthAzimuthDeg < 0) earthAzimuthDeg += 360;

  let earthVisibilityStatus = 'Direct Line of Sight to Earth';
  if (earthElevDeg > 45) {
    earthVisibilityStatus = `High Overhead Earth (+${earthElevDeg.toFixed(1)}° above horizon)`;
  } else if (earthElevDeg > 5) {
    earthVisibilityStatus = `Mid-Sky Line of Sight (+${earthElevDeg.toFixed(1)}° above horizon)`;
  } else if (earthElevDeg > 0) {
    earthVisibilityStatus = `Low Horizon Line of Sight (+${earthElevDeg.toFixed(1)}° above horizon, libration sensitive)`;
  } else {
    earthVisibilityStatus = `Farside Radio Shadow (${Math.abs(earthElevDeg).toFixed(1)}° below horizon · Relay satellite required)`;
  }

  // 6. Realistic Lunar Surface Temperature Calculation:
  let estimatedTempC = -130;
  if (isDeepPolarColdTrap) {
    estimatedTempC = -246; // cryogenic permanent cold trap
  } else if (isDaytime) {
    // Peak temperature reaches ~120°C at subsolar noon, falling with cos(zenith)^0.25
    const zenithAngle = Math.max(0, 90 - localSunElevDeg);
    const cosFactor = Math.pow(Math.cos(zenithAngle * toRad), 0.25);
    estimatedTempC = Math.round(-130 + 250 * cosFactor);
  } else {
    estimatedTempC = -130; // standard lunar night equilibrium
  }

  return {
    utcDateString: date.toUTCString(),
    localDateString: date.toLocaleString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    julianDate: Math.round(jd * 1000) / 1000,
    phaseName,
    illuminatedFraction,
    illuminatedPercentage,
    lunarAgeDays: Math.round(lunarAgeDays * 10) / 10,
    synodicMonthDays: synodicMonth,
    subsolarLatitude: Math.round(subsolarLat * 100) / 100,
    subsolarLongitude: Math.round(subsolarLon * 100) / 100,
    subEarthLatitude: Math.round(subEarthLat * 100) / 100,
    subEarthLongitude: Math.round(subEarthLon * 100) / 100,
    targetLatitude: targetLat,
    targetLongitude: targetLon,
    localSunElevationDegrees: Math.round(localSunElevDeg * 10) / 10,
    localSunAzimuthDegrees: Math.round(sunAzimuthDeg * 10) / 10,
    localSunCompass: degreesToCompass(sunAzimuthDeg),
    isDaytime,
    isTerminatorZone,
    lightingStatus,
    earthElevationDegrees: Math.round(earthElevDeg * 10) / 10,
    earthAzimuthDegrees: Math.round(earthAzimuthDeg * 10) / 10,
    earthCompass: degreesToCompass(earthAzimuthDeg),
    isEarthVisible,
    earthVisibilityStatus,
    estimatedSurfaceTempC: estimatedTempC,
  };
}

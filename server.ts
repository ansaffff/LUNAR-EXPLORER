import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

let quotaCooldownUntil = 0;

interface AnalysisRequest {
  siteName: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  terrainType: string;
  surfaceSlopeDegrees: number;
  craterDensity: string;
  boulderRisk: string;
  illumination: string;
  dustDensity: string;
}

app.post('/api/analyze-landing-site', async (req, res) => {
  const site: AnalysisRequest = req.body;
  console.log('Received analysis request for:', site?.siteName);

  if (!site || typeof site.latitude !== 'number') {
    return res.status(400).json({ error: 'Invalid landing site coordinates provided.' });
  }

  // Track quota cooldown to prevent spamming exhausted API
  if (ai && Date.now() > quotaCooldownUntil) {
    try {
      const prompt = `You are a Senior Lunar Mission Flight Director and Planetary Geologist at NASA / LunarNav Mission Operations.
Evaluate the landing safety of the following lunar touchdown site:
- Site Name: ${site.siteName || 'Custom Coordinates'}
- Coordinates: ${site.latitude.toFixed(2)}° Lat, ${site.longitude.toFixed(2)}° Lon
- Terrain Classification: ${site.terrainType}
- Estimated Surface Slope: ${site.surfaceSlopeDegrees}°
- Elevation: ${site.elevationMeters} meters relative to lunar reference radius
- Crater Density: ${site.craterDensity}
- Boulder Hazard Level: ${site.boulderRisk}
- Solar Illumination: ${site.illumination}
- Regolith / Dust Particulate Density: ${site.dustDensity}

Provide a comprehensive, highly objective mission safety assessment.
Include:
1. safetyScore: A number from 0 to 100 where 85-100 is Low Risk (Prime Site), 65-84 is Moderate Risk (Caution Required), and below 65 is High Risk / Hazardous.
2. riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
3. verdict: A concise 2-sentence executive summary verdict for mission planners.
4. primaryHazards: Array of 3-4 specific hazard assessments (e.g. slope tip-over risk, optical sensor dust blinding, communication shadow, shadows/thermal extremes).
5. touchdownRecommendations: Array of 3 key flight & landing radar recommendations (e.g. vertical descent velocity limit, thruster cutoff altitude, hazard detection radar sensitivity).
6. sciencePotential: A brief paragraph describing why this landing site is scientifically or strategically valuable.
7. goNoGoStatus: 'GO' | 'GO WITH CAUTION' | 'NO GO'`;

      const apiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              safetyScore: { type: Type.INTEGER, description: 'Safety score 0-100' },
              riskLevel: { type: Type.STRING, description: 'LOW, MODERATE, or HIGH' },
              verdict: { type: Type.STRING, description: 'Concise executive verdict' },
              goNoGoStatus: { type: Type.STRING, description: 'GO, GO WITH CAUTION, or NO GO' },
              primaryHazards: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key hazards',
              },
              touchdownRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Landing flight recommendations',
              },
              sciencePotential: {
                type: Type.STRING,
                description: 'Scientific and operational value of the site',
              },
            },
            required: ['safetyScore', 'riskLevel', 'verdict', 'goNoGoStatus', 'primaryHazards', 'touchdownRecommendations', 'sciencePotential'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 5000)
      );

      const response = await Promise.race([apiCall, timeoutPromise]);
      const responseText = response.text;
      if (responseText) {
        const analysis = JSON.parse(responseText);
        return res.json({ success: true, analysis, source: 'gemini' });
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
        // Set 1-hour cooldown so subsequent requests don't spam rate-limited API
        quotaCooldownUntil = Date.now() + 60 * 60 * 1000;
        console.info('Gemini free tier quota limit reached; engaging autonomous flight dynamics engine.');
      } else {
        console.info('AI service unavailable or timed out; engaging flight dynamics engine.');
      }
    }
  }

  // Deterministic aerospace heuristic safety calculation fallback if API is not set or network fails
  const slope = site.surfaceSlopeDegrees || 4.2;
  const isPolar = Math.abs(site.latitude) > 75;
  let baseScore = 90;
  if (slope > 12) baseScore -= 30;
  else if (slope > 7) baseScore -= 15;
  if (site.boulderRisk === 'High') baseScore -= 18;
  if (site.craterDensity === 'High') baseScore -= 12;
  if (isPolar) baseScore -= 8; // Extreme low-angle shadows
  baseScore = Math.max(25, Math.min(96, Math.round(baseScore)));

  const riskLevel = baseScore >= 80 ? 'LOW' : baseScore >= 65 ? 'MODERATE' : 'HIGH';
  const goNoGoStatus = baseScore >= 80 ? 'GO' : baseScore >= 60 ? 'GO WITH CAUTION' : 'NO GO';

  return res.json({
    success: true,
    analysis: {
      safetyScore: baseScore,
      riskLevel,
      verdict: `Site evaluated at ${site.latitude.toFixed(1)}° Lat, ${site.longitude.toFixed(1)}° Lon exhibits ${riskLevel.toLowerCase()} landing risk with a calculated surface slope of ${slope.toFixed(1)}°. Overall descent trajectory is viable under standard autonomous hazard detection protocols.`,
      goNoGoStatus,
      primaryHazards: [
        slope > 8 ? `High surface tilt (${slope.toFixed(1)}°) may exceed lander gear tip-over threshold.` : `Manageable local slope (${slope.toFixed(1)}°) well within 15° stability envelope.`,
        isPolar ? 'Low solar incidence angle produces extended shadows, affecting optical navigation cameras.' : 'Normal daylight illumination supports standard terrain relative navigation (TRN).',
        `High velocity thruster exhaust will loft electrostatic regolith dust below 15m altitude.`,
        site.boulderRisk === 'High' ? 'Elevated rock field density requires autonomous retargeting diverts.' : 'Moderate micro-cratering requires secondary hazard avoidance verification.'
      ],
      touchdownRecommendations: [
        'Engage Doppler LIDAR hazard avoidance at 500m above ground level.',
        'Limit terminal vertical descent velocity to ≤ 1.2 m/s upon contact sensor trip.',
        'Execute immediate thruster cutoff within 50ms of footpad ground switch trigger.'
      ],
      sciencePotential: isPolar
        ? 'High strategic priority: Proximity to permanently shadowed cold traps with suspected volatile water-ice deposits and extended ridge illumination.'
        : 'Rich geological sample return candidate for analyzing mare basalt crystallization and impact ejecta composition.'
    },
    source: 'heuristic'
  });
});

// Endpoint: AI analyzes and recommends the best lunar landing locations
app.post('/api/ai-recommended-sites', async (req, res) => {
  const { missionProfile = 'balanced' } = req.body || {};

  if (ai && Date.now() > quotaCooldownUntil) {
    try {
      const prompt = `You are the Lead Lunar Cartographer and Mission Commander at NASA / Artemis Operations.
Analyze global lunar surface cartography and recommend the top 4 best landing sites for a '${missionProfile}' mission.
For each site, provide:
1. name: string
2. latitude: number (-90 to 90)
3. longitude: number (-180 to 180)
4. safetyScore: integer (0-100)
5. terrainType: string
6. whyRecommended: string (2 concise sentences)
7. primaryAdvantage: string (under 10 words)
8. missionFit: string ('Safest Flat Touchdown' | 'Artemis Water-Ice Prospecting' | 'Continuous Solar Energy' | 'Youngest Volcanic Samples')

Order the sites from highest recommendation rank #1 to #4.`;

      const apiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    latitude: { type: Type.NUMBER },
                    longitude: { type: Type.NUMBER },
                    safetyScore: { type: Type.INTEGER },
                    terrainType: { type: Type.STRING },
                    whyRecommended: { type: Type.STRING },
                    primaryAdvantage: { type: Type.STRING },
                    missionFit: { type: Type.STRING },
                  },
                  required: ['name', 'latitude', 'longitude', 'safetyScore', 'terrainType', 'whyRecommended', 'primaryAdvantage', 'missionFit'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI recommendation timeout')), 5000)
      );

      const response = await Promise.race([apiCall, timeoutPromise]);
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed?.recommendations?.length > 0) {
          return res.json({ success: true, recommendations: parsed.recommendations, source: 'gemini' });
        }
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
        quotaCooldownUntil = Date.now() + 60 * 60 * 1000;
        console.info('Gemini quota reached for recommendations; using autonomous flight dynamics database.');
      }
    }
  }

  // Curated AI Flight Dynamics Top Recommendations Fallback
  const fallbackRecommendations = [
    {
      name: 'Mare Tranquillitatis (Apollo 11 Plains)',
      latitude: 0.67,
      longitude: 23.47,
      safetyScore: 96,
      terrainType: 'Flat Basaltic Lowland Sea',
      whyRecommended: 'Extremely flat basaltic lava sheets offer minimal slope hazard (under 2.2°) with verified touchdown stability and low rock density.',
      primaryAdvantage: 'Lowest slope and rock risk on nearside',
      missionFit: 'Safest Flat Touchdown'
    },
    {
      name: 'Oceanus Procellarum (Ocean of Storms)',
      latitude: 18.4,
      longitude: -57.4,
      safetyScore: 93,
      terrainType: 'Vast Volcanic Lowland Plain',
      whyRecommended: 'The largest contiguous mare basin on the Moon provides expansive landing corridors, smooth regolith, and continuous direct Earth line-of-sight.',
      primaryAdvantage: 'Expansive landing safety margin',
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

  return res.json({
    success: true,
    recommendations: fallbackRecommendations,
    source: 'flight-dynamics'
  });
});

// Serve public static assets (e.g. NASA textures) directly
app.use(express.static(path.join(__dirname, 'public')));

// Setup Vite middlewares for development, or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`LunarNav server running on port ${PORT}`);
  });
}

startServer();

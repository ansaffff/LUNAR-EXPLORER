import * as THREE from 'three';

// Procedural high-fidelity lunar surface generator
export interface LunarTextures {
  colorTexture: THREE.CanvasTexture;
  bumpTexture: THREE.CanvasTexture;
}

export function generateLunarTextures(): LunarTextures {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  // 1. Base Highlands (Terrae) - Pale grey anorthosite
  colorCtx.fillStyle = '#9da3aa';
  colorCtx.fillRect(0, 0, width, height);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, width, height);

  // Helper: map Lat/Lon to Canvas X/Y
  // Lon: -180 to 180 -> X: 0 to width
  // Lat: 90 (North) to -90 (South) -> Y: 0 to height
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Multi-frequency highland noise texture
  const imgData = colorCtx.getImageData(0, 0, width, height);
  const bumpData = bumpCtx.getImageData(0, 0, width, height);
  const cData = imgData.data;
  const bData = bumpData.data;

  // Simple pseudo-random hash for noise
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  // Add subtle regolith noise across the entire surface
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const n1 = hash(x * 0.05, y * 0.05);
      const n2 = hash(x * 0.2, y * 0.2);
      const noise = (n1 * 0.7 + n2 * 0.3 - 0.5) * 22;

      for (let dy = 0; dy < 2 && y + dy < height; dy++) {
        for (let dx = 0; dx < 2 && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          cData[idx] = Math.min(255, Math.max(0, cData[idx] + noise));
          cData[idx + 1] = Math.min(255, Math.max(0, cData[idx + 1] + noise * 0.95));
          cData[idx + 2] = Math.min(255, Math.max(0, cData[idx + 2] + noise * 0.9));

          bData[idx] = Math.min(255, Math.max(0, bData[idx] + noise * 0.7));
          bData[idx + 1] = bData[idx];
          bData[idx + 2] = bData[idx];
        }
      }
    }
  }

  colorCtx.putImageData(imgData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  // 3. Draw Lunar Maria (Dark Basalt Plains)
  interface MareRegion {
    lon: number;
    lat: number;
    radiusX: number;
    radiusY: number;
    rotation?: number;
    darkness: number; // 0 (black) to 1
  }

  const maria: MareRegion[] = [
    // Oceanus Procellarum (vast western mare)
    { lon: -55, lat: 20, radiusX: 180, radiusY: 210, rotation: 0.1, darkness: 0.38 },
    { lon: -40, lat: 35, radiusX: 110, radiusY: 130, rotation: -0.2, darkness: 0.40 },
    { lon: -60, lat: -5, radiusX: 130, radiusY: 150, rotation: 0.3, darkness: 0.42 },
    // Mare Imbrium (circular basin)
    { lon: -17, lat: 34, radiusX: 140, radiusY: 120, rotation: 0, darkness: 0.36 },
    // Mare Serenitatis
    { lon: 18, lat: 28, radiusX: 100, radiusY: 90, rotation: -0.1, darkness: 0.37 },
    // Mare Tranquillitatis
    { lon: 28, lat: 8, radiusX: 120, radiusY: 100, rotation: 0.2, darkness: 0.34 },
    // Mare Crisium (isolated oval)
    { lon: 59, lat: 17, radiusX: 70, radiusY: 55, rotation: 0.05, darkness: 0.32 },
    // Mare Fecunditatis
    { lon: 51, lat: -4, radiusX: 95, radiusY: 85, rotation: 0.3, darkness: 0.40 },
    // Mare Nectaris
    { lon: 35, lat: -15, radiusX: 60, radiusY: 50, rotation: -0.1, darkness: 0.39 },
    // Mare Nubium
    { lon: -16, lat: -21, radiusX: 90, radiusY: 80, rotation: 0.15, darkness: 0.41 },
    // Mare Humorum
    { lon: -38, lat: -24, radiusX: 55, radiusY: 50, rotation: 0, darkness: 0.38 },
    // Mare Frigoris (long northern ribbon)
    { lon: 0, lat: 56, radiusX: 200, radiusY: 35, rotation: -0.05, darkness: 0.44 },
    { lon: -40, lat: 54, radiusX: 120, radiusY: 30, rotation: 0.1, darkness: 0.45 },
    { lon: 40, lat: 53, radiusX: 100, radiusY: 28, rotation: -0.1, darkness: 0.46 },
    // Mare Vaporum & Sinus Medii
    { lon: 4, lat: 13, radiusX: 45, radiusY: 40, rotation: 0, darkness: 0.40 },
    { lon: 0, lat: 2, radiusX: 35, radiusY: 30, rotation: 0, darkness: 0.42 },
    // Farside smaller dark patches (Mare Moscoviense, Mare Ingenii)
    { lon: 147, lat: 27, radiusX: 40, radiusY: 35, rotation: 0, darkness: 0.48 },
    { lon: 163, lat: -33, radiusX: 45, radiusY: 35, rotation: 0, darkness: 0.49 },
  ];

  maria.forEach((m) => {
    const cx = toX(m.lon);
    const cy = toY(m.lat);

    colorCtx.save();
    colorCtx.translate(cx, cy);
    if (m.rotation) colorCtx.rotate(m.rotation);

    // Soft organic radial gradient for mare basalt
    const grad = colorCtx.createRadialGradient(0, 0, m.radiusX * 0.15, 0, 0, m.radiusX);
    const darkVal = Math.floor(m.darkness * 110);
    grad.addColorStop(0, `rgb(${darkVal}, ${darkVal + 2}, ${darkVal + 5})`);
    grad.addColorStop(0.7, `rgb(${darkVal + 20}, ${darkVal + 22}, ${darkVal + 24})`);
    grad.addColorStop(1, 'rgba(157, 163, 170, 0)');

    colorCtx.fillStyle = grad;
    colorCtx.beginPath();
    colorCtx.ellipse(0, 0, m.radiusX, m.radiusY, 0, 0, Math.PI * 2);
    colorCtx.fill();
    colorCtx.restore();

    // Bump map: Maria basins are lower elevation depressions (darker in bump map)
    bumpCtx.save();
    bumpCtx.translate(cx, cy);
    if (m.rotation) bumpCtx.rotate(m.rotation);

    const bGrad = bumpCtx.createRadialGradient(0, 0, m.radiusX * 0.2, 0, 0, m.radiusX);
    bGrad.addColorStop(0, 'rgba(60, 60, 60, 0.4)');
    bGrad.addColorStop(0.8, 'rgba(80, 80, 80, 0.2)');
    bGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');

    bumpCtx.fillStyle = bGrad;
    bumpCtx.beginPath();
    bumpCtx.ellipse(0, 0, m.radiusX, m.radiusY, 0, 0, Math.PI * 2);
    bumpCtx.fill();
    bumpCtx.restore();
  });

  // 4. Function to render realistic impact craters (rim, bowl, central peak)
  const drawCrater = (
    lon: number,
    lat: number,
    radius: number,
    options?: { hasRaySystem?: boolean; rayLength?: number; rayCount?: number; rayColor?: string; highAlbedo?: boolean }
  ) => {
    const cx = toX(lon);
    const cy = toY(lat);

    // Rays (e.g. Tycho, Copernicus, Kepler)
    if (options?.hasRaySystem) {
      const rayLen = options.rayLength || radius * 12;
      const rayCount = options.rayCount || 20;
      colorCtx.save();
      colorCtx.translate(cx, cy);

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + (hash(i, cx) - 0.5) * 0.3;
        const length = rayLen * (0.6 + hash(i * 3, cy) * 0.8);
        const rayGrad = colorCtx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
        rayGrad.addColorStop(0, 'rgba(240, 243, 246, 0.65)');
        rayGrad.addColorStop(0.3, 'rgba(225, 230, 235, 0.35)');
        rayGrad.addColorStop(0.8, 'rgba(210, 215, 220, 0.1)');
        rayGrad.addColorStop(1, 'rgba(180, 185, 190, 0)');

        colorCtx.strokeStyle = rayGrad;
        colorCtx.lineWidth = Math.max(1.5, radius * 0.18 * (0.7 + hash(i, 42) * 0.6));
        colorCtx.beginPath();
        colorCtx.moveTo(0, 0);
        colorCtx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        colorCtx.stroke();
      }
      colorCtx.restore();
    }

    // Crater Wall / Rim (Ejecta blanket - bright)
    colorCtx.save();
    const rimGrad = colorCtx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.5);
    const rimColor = options?.highAlbedo ? 'rgba(245, 248, 252, 0.9)' : 'rgba(215, 220, 225, 0.75)';
    rimGrad.addColorStop(0, rimColor);
    rimGrad.addColorStop(0.7, 'rgba(200, 205, 210, 0.4)');
    rimGrad.addColorStop(1, 'rgba(160, 165, 170, 0)');
    colorCtx.fillStyle = rimGrad;
    colorCtx.beginPath();
    colorCtx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    colorCtx.fill();

    // Crater Bowl (depressed center, shadowed floor)
    const bowlGrad = colorCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    bowlGrad.addColorStop(0, 'rgba(75, 80, 85, 0.85)');
    bowlGrad.addColorStop(0.7, 'rgba(95, 100, 105, 0.7)');
    bowlGrad.addColorStop(1, 'rgba(160, 165, 170, 0)');
    colorCtx.fillStyle = bowlGrad;
    colorCtx.beginPath();
    colorCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    colorCtx.fill();

    // Central peak if large crater
    if (radius > 8) {
      colorCtx.fillStyle = 'rgba(235, 240, 245, 0.8)';
      colorCtx.beginPath();
      colorCtx.arc(cx, cy, radius * 0.18, 0, Math.PI * 2);
      colorCtx.fill();
    }
    colorCtx.restore();

    // Bump Map for Crater
    bumpCtx.save();
    // Elevated Rim
    const bRimGrad = bumpCtx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.3);
    bRimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    bRimGrad.addColorStop(0.7, 'rgba(210, 210, 210, 0.4)');
    bRimGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bumpCtx.fillStyle = bRimGrad;
    bumpCtx.beginPath();
    bumpCtx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
    bumpCtx.fill();

    // Depressed Bowl
    const bBowlGrad = bumpCtx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.85);
    bBowlGrad.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
    bBowlGrad.addColorStop(0.8, 'rgba(60, 60, 60, 0.6)');
    bBowlGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bumpCtx.fillStyle = bBowlGrad;
    bumpCtx.beginPath();
    bumpCtx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
    bumpCtx.fill();

    // Central peak
    if (radius > 8) {
      bumpCtx.fillStyle = 'rgba(240, 240, 240, 0.8)';
      bumpCtx.beginPath();
      bumpCtx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
      bumpCtx.fill();
    }
    bumpCtx.restore();
  };

  // 5. Landmark Craters with Accurate Coordinates
  // Tycho: spectacular rayed crater at 43.3°S, 11.2°W
  drawCrater(-11.2, -43.3, 14, { hasRaySystem: true, rayLength: 450, rayCount: 26, highAlbedo: true });

  // Copernicus: 9.6°N, 20.1°W
  drawCrater(-20.1, 9.6, 15, { hasRaySystem: true, rayLength: 260, rayCount: 20, highAlbedo: true });

  // Kepler: 8.1°N, 38.0°W
  drawCrater(-38.0, 8.1, 9, { hasRaySystem: true, rayLength: 160, rayCount: 14, highAlbedo: true });

  // Aristarchus: 23.7°N, 47.4°W (brightest crater on nearside)
  drawCrater(-47.4, 23.7, 10, { highAlbedo: true, hasRaySystem: true, rayLength: 120, rayCount: 10 });

  // Plato: 51.6°N, 9.3°W (dark volcanic floor)
  drawCrater(-9.3, 51.6, 16);

  // Clavius: 58.4°S, 14.4°W (giant highland crater with internal arc of craters)
  drawCrater(-14.4, -58.4, 28);
  drawCrater(-12.0, -58.0, 5);
  drawCrater(-14.0, -59.5, 4);

  // Shackleton Crater (Lunar South Pole, 89.9°S, 0.0°E - Key target for Artemis)
  drawCrater(0, -89.0, 11, { highAlbedo: true });

  // Other well-known craters
  const prominentCraters = [
    { lon: -17.5, lat: 20.2, r: 12 }, // Eratosthenes
    { lon: -4.0, lat: 29.7, r: 13 }, // Archimedes
    { lon: 60.9, lat: -8.9, r: 16 }, // Langrenus
    { lon: 60.4, lat: -25.3, r: 18 }, // Petavius
    { lon: 54.3, lat: -44.1, r: 14 }, // Stevinus
    { lon: -20.0, lat: -9.8, r: 11 }, // Guericke
    { lon: 1.1, lat: 25.2, r: 10 }, // Autolycus
    { lon: 0.8, lat: 26.4, r: 11 }, // Aristillus
    { lon: -11.0, lat: -3.0, r: 12 }, // Ptolemaeus
    { lon: -11.8, lat: -9.2, r: 11 }, // Alphonsus
    { lon: -11.9, lat: -15.4, r: 12 }, // Arzachel
    { lon: -36.5, lat: -16.0, r: 14 }, // Gassendi
    { lon: 31.0, lat: 19.4, r: 10 }, // Posidonius
    { lon: 75.0, lat: -12.0, r: 13 }, // Humboldt
    // Farside craters (densely cratered highland hemisphere)
    { lon: 178.0, lat: -5.0, r: 18 }, // Daedalus
    { lon: 159.0, lat: 34.0, r: 15 }, // Campbell
    { lon: 120.0, lat: 10.0, r: 14 }, // Fleming
    { lon: 105.0, lat: -20.0, r: 17 }, // Tsiolkovskiy (dark basalt floor!)
    { lon: 160.0, lat: -50.0, r: 24 }, // Apollo Basin
    { lon: 140.0, lat: -60.0, r: 22 }, // Poincaré
  ];

  prominentCraters.forEach((c) => {
    drawCrater(c.lon, c.lat, c.r);
  });

  // 6. Scatter hundreds of realistic medium and small craters across the sphere,
  // especially concentrated in the southern highlands and farside
  const seedCount = 450;
  for (let i = 0; i < seedCount; i++) {
    const lon = (hash(i, 11) - 0.5) * 360;
    const lat = (hash(i, 22) - 0.5) * 170;
    // Higher density in highlands (south pole and farside)
    const isHighland = lat < -15 || Math.abs(lon) > 85;
    const baseRadius = 2 + hash(i, 33) * 6;
    const r = isHighland ? baseRadius * 1.2 : baseRadius * 0.75;
    const isBright = hash(i, 44) > 0.88;

    drawCrater(lon, lat, r, { highAlbedo: isBright });
  }

  // 7. Mountain Ranges (Montes Apenninus, Montes Caucasus, Montes Alpes)
  const drawMountainRidge = (startLon: number, startLat: number, endLon: number, endLat: number) => {
    const steps = 30;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const lon = startLon + (endLon - startLon) * t + (hash(s, 77) - 0.5) * 1.8;
      const lat = startLat + (endLat - startLat) * t + (hash(s, 88) - 0.5) * 1.8;
      const cx = toX(lon);
      const cy = toY(lat);

      colorCtx.fillStyle = 'rgba(235, 238, 242, 0.6)';
      colorCtx.beginPath();
      colorCtx.arc(cx, cy, 3.5 + hash(s, 99) * 3, 0, Math.PI * 2);
      colorCtx.fill();

      bumpCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      bumpCtx.beginPath();
      bumpCtx.arc(cx, cy, 4 + hash(s, 99) * 3, 0, Math.PI * 2);
      bumpCtx.fill();
    }
  };

  // Montes Apenninus (bounding southeast edge of Mare Imbrium)
  drawMountainRidge(-10, 18, 0, 30);
  // Montes Caucasus
  drawMountainRidge(5, 32, 12, 40);
  // Montes Alpes
  drawMountainRidge(-5, 42, -18, 50);

  // Create Three.js Textures
  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.ClampToEdgeWrapping;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

  return { colorTexture, bumpTexture };
}

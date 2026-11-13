import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { generateLunarTextures } from '../utils/lunarTexture';

interface MoonViewerProps {
  selectedLat: number;
  selectedLon: number;
  onSelectCoordinates: (lat: number, lon: number) => void;
  showDustParticles?: boolean;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
  subsolarLat?: number;
  subsolarLon?: number;
  isAstronomicalSun?: boolean;
  centerTrigger?: number;
  onHoverCoordinates?: (coords: { lat: number; lon: number } | null) => void;
}

// Convert Lat/Lon (degrees) to 3D Cartesian coordinates on sphere of radius R
// In standard lunar frame: Lat=0, Lon=0 faces Earth (+Z), East (+Lon) is +X, North is +Y
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);

  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return new THREE.Vector3(x, y, z);
}

// Convert 3D Cartesian point on sphere of radius R back to Lat/Lon
function vector3ToLatLon(vec: THREE.Vector3, _radius: number): { lat: number; lon: number } {
  const norm = vec.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * (180 / Math.PI);
  let lon = Math.atan2(norm.x, norm.z) * (180 / Math.PI);
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;

  return { lat, lon };
}

export const MoonViewer: React.FC<MoonViewerProps> = ({
  selectedLat,
  selectedLon,
  onSelectCoordinates,
  autoRotate = false,
  subsolarLat = 0,
  subsolarLon = 0,
  isAstronomicalSun = true,
  centerTrigger = 0,
  onHoverCoordinates,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetCoordinatesRef = useRef({ lat: selectedLat, lon: selectedLon });
  const onSelectCoordinatesRef = useRef(onSelectCoordinates);
  const onHoverCoordinatesRef = useRef(onHoverCoordinates);
  const autoRotateRef = useRef(autoRotate);
  const subsolarCoordsRef = useRef({ lat: subsolarLat, lon: subsolarLon });
  const isAstroSunRef = useRef(isAstronomicalSun);
  const targetGroupRotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetCoordinatesRef.current = { lat: selectedLat, lon: selectedLon };
  }, [selectedLat, selectedLon]);

  useEffect(() => {
    subsolarCoordsRef.current = { lat: subsolarLat, lon: subsolarLon };
    isAstroSunRef.current = isAstronomicalSun;
  }, [subsolarLat, subsolarLon, isAstronomicalSun]);

  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  useEffect(() => {
    onHoverCoordinatesRef.current = onHoverCoordinates;
  }, [onHoverCoordinates]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Center view on selected location when centerTrigger increments
  useEffect(() => {
    if (centerTrigger > 0) {
      const latRad = (selectedLat * Math.PI) / 180;
      const lonRad = (selectedLon * Math.PI) / 180;
      targetGroupRotationRef.current = {
        y: -lonRad,
        x: Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, latRad)),
      };
    }
  }, [centerTrigger, selectedLat, selectedLon]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040609);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Deep Space Starfield
    const starCount = isSoftwareGl ? 500 : 1200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 90 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness * 0.98;
      starColors[i * 3 + 2] = brightness * (0.95 + Math.random() * 0.05);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Moon Group
    const moonRadius = 2.4;
    const moonGroup = new THREE.Group();
    scene.add(moonGroup);

    // Generous segments for smooth circular sphere (no polygonal edges)
    const segments = isSoftwareGl ? 64 : 96;
    const moonGeometry = new THREE.SphereGeometry(moonRadius, segments, segments);

    // Load Real NASA Photographic Lunar Texture Map
    const textureLoader = new THREE.TextureLoader();
    let isDisposed = false;

    // Start with fallback texture immediately, then upgrade smoothly when NASA image loads
    const fallbackTextures = generateLunarTextures();
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: fallbackTextures.colorTexture,
      bumpMap: fallbackTextures.bumpTexture,
      bumpScale: 0.05,
      roughness: 0.97, // Matte lunar regolith
      metalness: 0.02,
    });

    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    // Align texture Prime Meridian (Lon 0, Lat 0) facing Earth / Camera (+Z)
    moonMesh.rotation.y = -Math.PI / 2;
    moonGroup.add(moonMesh);

    // Load actual high-resolution NASA Lunar Reconnaissance Orbiter texture
    textureLoader.load(
      '/textures/moon_2k.jpg',
      (nasaTexture) => {
        if (isDisposed) return;
        nasaTexture.colorSpace = THREE.SRGBColorSpace;
        nasaTexture.wrapS = THREE.RepeatWrapping;
        nasaTexture.wrapT = THREE.ClampToEdgeWrapping;
        nasaTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        moonMaterial.map = nasaTexture;
        moonMaterial.bumpMap = nasaTexture;
        moonMaterial.bumpScale = 0.065; // Authentic crater depth and mountain relief
        moonMaterial.roughness = 0.96;
        moonMaterial.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('NASA texture load error, retaining procedural map:', err);
      }
    );

    // 3D Landing Reticle / Marker
    const markerGroup = new THREE.Group();
    moonGroup.add(markerGroup);

    // Target Outer Ring
    const ringGeo = new THREE.RingGeometry(0.065, 0.082, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    markerGroup.add(ringMesh);

    // Target Inner Ring
    const innerRingGeo = new THREE.RingGeometry(0.02, 0.035, 24);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    markerGroup.add(innerRingMesh);

    // Vertical Landing Pin
    const beaconGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.35, 12);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.z = 0.175;
    beaconMesh.rotation.x = Math.PI / 2;
    markerGroup.add(beaconMesh);

    // Top Orb
    const orbGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
    });
    const orbMesh = new THREE.Mesh(orbGeo, orbMat);
    orbMesh.position.z = 0.35;
    markerGroup.add(orbMesh);

    // Position marker at current lat/lon
    const updateMarkerPosition = (lat: number, lon: number) => {
      const surfacePos = latLonToVector3(lat, lon, moonRadius + 0.006);
      markerGroup.position.copy(surfacePos);

      const normal = surfacePos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      markerGroup.setRotationFromQuaternion(quaternion);
    };

    updateMarkerPosition(targetCoordinatesRef.current.lat, targetCoordinatesRef.current.lon);

    // Realistic Space Lighting Setup:
    // 1. Direct Sunlight
    const sunLight = new THREE.DirectionalLight(0xfffef2, 3.2);
    moonGroup.add(sunLight);
    moonGroup.add(sunLight.target);
    sunLight.target.position.set(0, 0, 0);

    // 2. Realistic Earthshine: soft atmospheric bluish hue from Earth (+Z)
    const earthshine = new THREE.DirectionalLight(0x8da5e8, 0.24);
    earthshine.position.set(0, 0, 8.5);
    scene.add(earthshine);

    // 3. Low celestial ambient light for deep-space contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(ambientLight);

    // Interaction handlers
    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let dragStartPointer = { x: 0, y: 0 };
    let pointerDownTime = 0;

    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    const getRaycastHit = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mousePos.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mousePos, camera);
      const intersects = raycaster.intersectObject(moonMesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const localHit = hit.point.clone();
        moonGroup.worldToLocal(localHit);
        return vector3ToLatLon(localHit, moonRadius);
      }
      return null;
    };

    const selectFromClientXY = (clientX: number, clientY: number) => {
      const coords = getRaycastHit(clientX, clientY);
      if (coords) {
        const { lat, lon } = coords;
        targetCoordinatesRef.current = { lat, lon };
        updateMarkerPosition(lat, lon);
        onSelectCoordinatesRef.current(lat, lon);
        return true;
      }
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      pointerDownTime = Date.now();
      previousPointer = { x: e.clientX, y: e.clientY };
      dragStartPointer = { x: e.clientX, y: e.clientY };
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousPointer.x;
        const deltaY = e.clientY - previousPointer.y;

        targetGroupRotationRef.current.y += deltaX * 0.005;
        targetGroupRotationRef.current.x += deltaY * 0.005;
        targetGroupRotationRef.current.x = Math.max(
          -Math.PI * 0.45,
          Math.min(Math.PI * 0.45, targetGroupRotationRef.current.x)
        );

        previousPointer = { x: e.clientX, y: e.clientY };
      } else {
        // Hover raycast for live cursor coordinate feedback
        const hitCoords = getRaycastHit(e.clientX, e.clientY);
        onHoverCoordinatesRef.current?.(hitCoords);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      isDragging = false;

      const dist = Math.hypot(e.clientX - dragStartPointer.x, e.clientY - dragStartPointer.y);
      const elapsed = Date.now() - pointerDownTime;

      // Allow click if moved < 16px or tapped quickly (< 300ms) with dist < 28px
      if (dist < 16 || (elapsed < 300 && dist < 28)) {
        selectFromClientXY(e.clientX, e.clientY);
      }
    };

    const onPointerLeave = () => {
      onHoverCoordinatesRef.current?.(null);
    };

    const onClick = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - dragStartPointer.x, e.clientY - dragStartPointer.y);
      if (dist < 20) {
        selectFromClientXY(e.clientX, e.clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZ = camera.position.z + e.deltaY * 0.005;
      camera.position.z = Math.max(3.6, Math.min(14.0, newZ));
    };

    // Mobile touch pinch-to-zoom support
    let touchDistance = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (touchDistance > 0) {
          const delta = (touchDistance - currentDist) * 0.015;
          camera.position.z = Math.max(3.6, Math.min(14.0, camera.position.z + delta));
        }
        touchDistance = currentDist;
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointerleave', onPointerLeave);
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && !isDragging) {
        targetGroupRotationRef.current.y += delta * 0.06;
      }

      moonGroup.rotation.y = THREE.MathUtils.damp(
        moonGroup.rotation.y,
        targetGroupRotationRef.current.y,
        8,
        delta
      );
      moonGroup.rotation.x = THREE.MathUtils.damp(
        moonGroup.rotation.x,
        targetGroupRotationRef.current.x,
        8,
        delta
      );

      // Dynamic Astronomical or Studio Sunlight Direction
      if (isAstroSunRef.current) {
        const sunPos = latLonToVector3(
          subsolarCoordsRef.current.lat,
          subsolarCoordsRef.current.lon,
          16.0
        );
        sunLight.position.copy(sunPos);
        sunLight.intensity = 3.2;
      } else {
        const studioPos = new THREE.Vector3(4.2, 2.8, 8.5).applyQuaternion(
          moonGroup.quaternion.clone().invert()
        );
        sunLight.position.copy(studioPos);
        sunLight.intensity = 2.4;
      }

      // Pulse the landing marker rings
      const pulseScale = 1 + Math.sin(elapsed * 4) * 0.12;
      innerRingMesh.scale.set(pulseScale, pulseScale, 1);
      ringMesh.material.opacity = 0.8 + Math.sin(elapsed * 3) * 0.2;

      updateMarkerPosition(targetCoordinatesRef.current.lat, targetCoordinatesRef.current.lon);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      domEl.removeEventListener('click', onClick);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('touchstart', onTouchStart);
      domEl.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();

      fallbackTextures.colorTexture.dispose();
      fallbackTextures.bumpTexture.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

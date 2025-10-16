"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function CCTVScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();

    // Desaturated, gritty tone mapping and fog
    scene.fog = new THREE.FogExp2(0x222222, 0.03);

    const camera = new THREE.PerspectiveCamera(85, container.clientWidth / container.clientHeight, 0.1, 1000);
    // Low-angle, wide FOV, slightly tilted
    camera.position.set(0, 0.6, 7);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.55;
    container.appendChild(renderer.domElement);

    // Desaturation is achieved via material palette and tone mapping above.

    // Ground - deserted road with rough texture via noise
    const groundGeo = new THREE.PlaneGeometry(40, 40, 200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.25, 0.25, 0.25), roughness: 0.95, metalness: 0.05 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Road markings
    const markGeo = new THREE.PlaneGeometry(0.15, 6);
    const markMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 1, metalness: 0, emissive: 0x000000 });
    const centerMarks: THREE.Mesh[] = [];
    for (let i = -3; i <= 3; i++) {
      const m = new THREE.Mesh(markGeo, markMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.001, i * 2);
      centerMarks.push(m);
      scene.add(m);
    }

    // Side buildings silhouettes
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 1, metalness: 0 });
    for (let i = 0; i < 10; i++) {
      const width = 1 + Math.random() * 1.5;
      const height = 2 + Math.random() * 4;
      const depth = 1 + Math.random() * 1.5;
      const geo = new THREE.BoxGeometry(width, height, depth);
      const meshL = new THREE.Mesh(geo, buildingMat);
      meshL.position.set(-3.5 - Math.random() * 1.5, height / 2, -8 + i * 2);
      const meshR = meshL.clone();
      meshR.position.x = -meshL.position.x;
      scene.add(meshL, meshR);
    }

    // Harsh overhead streetlights (spotlights simulating pools of light)
    const lights: THREE.SpotLight[] = [];
    for (let i = -2; i <= 2; i++) {
      const spot = new THREE.SpotLight(0xf0f0e0, i === 0 ? 6.0 : 3.5, 12, Math.PI / 7, 0.6, 1.8);
      spot.position.set(0, 6, i * 4);
      spot.target.position.set(0, 0, i * 4);
      scene.add(spot);
      scene.add(spot.target);
      lights.push(spot);
    }

    // Subtle ambient fill
    scene.add(new THREE.AmbientLight(0x404040, 0.25));

    // Tiger and Dog placeholders using low-poly forms with distinct silhouettes
    const tigerMat = new THREE.MeshStandardMaterial({ color: 0xc8a76d, roughness: 0.9, metalness: 0 });
    const dogMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95, metalness: 0 });

    const tiger = new THREE.Group();
    {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.5), tigerMat);
      body.position.y = 0.6;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), tigerMat);
      head.position.set(0.95, 0.8, 0);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), tigerMat);
      tail.position.set(-0.9, 0.85, 0);
      tail.rotation.z = Math.PI / 6;
      tiger.add(body, head, tail);
    }
    tiger.position.set(-1.4, 0, 0);
    scene.add(tiger);

    const dog = new THREE.Group();
    {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.4), dogMat);
      body.position.y = 0.5;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), dogMat);
      head.position.set(0.7, 0.7, 0);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), dogMat);
      tail.position.set(-0.6, 0.75, 0);
      tail.rotation.z = -Math.PI / 5;
      dog.add(body, head, tail);
    }
    dog.position.set(1.4, 0, 0);
    scene.add(dog);

    // Strong shadows
    renderer.shadowMap.enabled = true;
    lights.forEach((l) => {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
    });
    [tiger, dog].forEach((g) => g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    }));
    ground.receiveShadow = true;

    // CCTV digital artifacts: scanlines + slight jitter + noise overlay via canvas CSS
    const scanlineMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.25 });
    const scanlineGeo = new THREE.BufferGeometry();
    const scanlineVerts: number[] = [];
    const lines = 120;
    for (let i = 0; i < lines; i++) {
      const y = (i / lines) * 2 - 1;
      scanlineVerts.push(-1, y, 0, 1, y, 0);
    }
    scanlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(scanlineVerts, 3));
    const scanline = new THREE.LineSegments(scanlineGeo, scanlineMat);
    // Render scanlines in NDC via an overlay camera
    const overlayScene = new THREE.Scene();
    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    overlayScene.add(scanline);

    // Audio: synthesize ambient + tiger growls + dog barks (no external files)
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioContext = listener.context;

    const ambient = new THREE.Audio(listener);
    const tigerAudio = new THREE.Audio(listener);
    const dogAudio = new THREE.Audio(listener);

    const createBuffer = (durationSec: number, render: (t: number, i: number, sr: number) => number) => {
      const sampleRate = audioContext.sampleRate;
      const length = Math.floor(durationSec * sampleRate);
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        data[i] = render(t, i, sampleRate);
      }
      return buffer;
    };

    // Looping ambient city-like noise: filtered noise + low hum
    const ambientBuffer = createBuffer(3.0, (t) => {
      const noise = (Math.random() * 2 - 1) * 0.4;
      const hum = Math.sin(2 * Math.PI * 55 * t) * 0.15;
      const flicker = Math.sin(2 * Math.PI * 1.7 * t) * 0.05;
      return (noise + hum + flicker) * 0.5;
    });
    ambient.setBuffer(ambientBuffer);
    ambient.setLoop(true);
    ambient.setVolume(0.22);

    // Tiger growl: low, modulated tone + noise burst, short non-looping
    const tigerGrowlBuffer = createBuffer(1.1, (t) => {
      const env = Math.min(1, t / 0.05) * Math.max(0, 1 - (t - 0.1) / 1.0);
      const baseFreq = 80 + 20 * Math.sin(2 * Math.PI * 2.2 * t);
      const tone = Math.sin(2 * Math.PI * baseFreq * t);
      const sub = Math.sin(2 * Math.PI * (baseFreq / 2) * t) * 0.6;
      const grit = (Math.random() * 2 - 1) * 0.35;
      return (tone * 0.5 + sub * 0.5 + grit * 0.6) * env * 0.9;
    });
    tigerAudio.setBuffer(tigerGrowlBuffer);
    tigerAudio.setLoop(false);
    tigerAudio.setVolume(0.6);

    // Dog bark: short percussive mid-frequency burst
    const dogBarkBuffer = createBuffer(0.25, (t) => {
      const env = Math.exp(-10 * t);
      const tone = Math.sin(2 * Math.PI * (220 + 40 * Math.sin(2 * Math.PI * 12 * t)) * t);
      const noise = (Math.random() * 2 - 1) * 0.5;
      return (tone * 0.6 + noise * 0.4) * env * 0.9;
    });
    dogAudio.setBuffer(dogBarkBuffer);
    dogAudio.setLoop(false);
    dogAudio.setVolume(0.55);

    let raf = 0;
    const start = performance.now();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const handleResize = () => onResize();
    window.addEventListener('resize', handleResize);
    onResize();

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const t = (performance.now() - start) / 1000;
      // Subtle idle motions for tension
      tiger.rotation.y = Math.sin(t * 0.4) * 0.05;
      dog.rotation.y = -Math.sin(t * 0.45) * 0.05;

      // Slight camera jitter for CCTV artifact
      const jitter = 0.003;
      camera.position.x = Math.sin(t * 2.3) * jitter;
      camera.position.y = 0.6 + Math.sin(t * 1.7) * jitter * 0.3;
      camera.lookAt(0, 0.5, 0);

      renderer.setClearColor(0x0a0a0a, 1);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(overlayScene, overlayCamera);
      renderer.autoClear = true;

      // Trigger sporadic growl/barks
      if (t > 1 && Math.abs(Math.sin(t * 0.8)) > 0.995 && !tigerAudio.isPlaying) tigerAudio.play();
      if (t > 1 && Math.abs(Math.cos(t * 1.1)) > 0.995 && !dogAudio.isPlaying) dogAudio.play();

      // After 10 seconds, cut to black
      if (t >= 10 && !cut) {
        setCut(true);
        ambient.stop();
        tigerAudio.stop();
        dogAudio.stop();
      }
    };

    raf = requestAnimationFrame(animate);

    // Start ambient when user interacts (autoplay restrictions)
    const onFirstInteraction = () => {
      if (!ambient.isPlaying) ambient.play();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
    window.addEventListener('pointerdown', onFirstInteraction);
    window.addEventListener('keydown', onFirstInteraction);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh & { geometry?: THREE.BufferGeometry; material?: any };
        if ((mesh as any).geometry) mesh.geometry.dispose();
        if ((mesh as any).material) {
          const m = mesh.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else if (m && typeof m.dispose === 'function') m.dispose();
        }
      });
    };
  }, [cut]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!cut && (
        <>
          <div className="cctv-overlay">
            <div className="row"><span>CAM 03</span><span>REC ●</span></div>
            <div className="row" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
              <span>WIDE FOV</span><span>{new Date().toISOString()}</span>
            </div>
          </div>
          <div className="cctv-vignette" />
          <div className="cctv-noise" />
        </>
      )}
      {cut && <div className="cut-to-black" />}
    </div>
  );
}

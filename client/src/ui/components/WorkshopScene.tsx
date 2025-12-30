import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function usePrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export default function WorkshopScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = usePrefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x060912, 6, 20);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 1.2, 6.5);

    const root = new THREE.Group();
    scene.add(root);

    // Lights (dark theme, subtle Christmas accents)
    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xbfd7ff, 0.75);
    key.position.set(3, 5, 4);
    scene.add(key);

    const red = new THREE.PointLight(0xff4d4d, 0.9, 10, 2);
    red.position.set(-2.8, 1.2, 2.4);
    scene.add(red);

    const green = new THREE.PointLight(0x65f0a5, 0.7, 10, 2);
    green.position.set(2.6, 1.0, 2.0);
    scene.add(green);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070a10,
      metalness: 0.2,
      roughness: 0.92,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.75;
    floor.receiveShadow = false;
    root.add(floor);

    // "Workshop" structures: minimalist geometry clusters (no cute assets)
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x0b1018, metalness: 0.6, roughness: 0.45 });
    const accentRedMat = new THREE.MeshStandardMaterial({ color: 0x7a1f2c, metalness: 0.45, roughness: 0.55, emissive: 0x140406 });
    const accentGreenMat = new THREE.MeshStandardMaterial({ color: 0x165a45, metalness: 0.45, roughness: 0.55, emissive: 0x03110c });

    const pillars = new THREE.Group();
    root.add(pillars);

    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 18);
    const beamGeo = new THREE.BoxGeometry(2.8, 0.12, 0.12);

    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 0.7;
      const p = new THREE.Mesh(pillarGeo, columnMat);
      p.position.set(x, 0.35, -1.2 - (i % 3) * 0.3);
      pillars.add(p);

      if (i % 2 === 0) {
        const b = new THREE.Mesh(beamGeo, i % 4 === 0 ? accentRedMat : accentGreenMat);
        b.position.set(x, 1.2, -1.2 - (i % 3) * 0.3);
        b.rotation.y = Math.PI / 8;
        pillars.add(b);
      }
    }

    // "Task cards" floating panels
    const cardGeo = new THREE.PlaneGeometry(1.2, 0.7);
    const makeCardMat = (hex: number) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        transparent: true,
        opacity: 0.88,
        metalness: 0.2,
        roughness: 0.35,
        emissive: 0x000000,
      });

    const cards: THREE.Mesh[] = [];
    const cardColors = [0x0e1522, 0x0d161f, 0x0b141d, 0x0f1824];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(cardGeo, makeCardMat(cardColors[i]!));
      m.position.set(-1.6 + i * 1.05, 0.55 + i * 0.05, 0.6 - i * 0.35);
      m.rotation.y = (i - 1.5) * 0.16;
      cards.push(m);
      root.add(m);
    }

    // Snow particles
    const snowCount = 900;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    const snowVel = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      snowPos[i * 3 + 1] = Math.random() * 8 + 0.5;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      snowVel[i] = 0.15 + Math.random() * 0.55;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    root.add(snow);

    // Mount
    host.appendChild(renderer.domElement);

    let width = 0;
    let height = 0;

    const pointer = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    const resize = () => {
      const r = host.getBoundingClientRect();
      width = Math.max(1, Math.floor(r.width));
      height = Math.max(1, Math.floor(r.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = (e.clientX - r.left) / Math.max(1, r.width);
      target.y = (e.clientY - r.top) / Math.max(1, r.height);
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let running = true;

    const onVis = () => {
      running = document.visibilityState === 'visible';
      if (running) {
        cancelAnimationFrame(raf);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const clock = new THREE.Clock();

    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();

      pointer.x = lerp(pointer.x, target.x, 0.06);
      pointer.y = lerp(pointer.y, target.y, 0.06);

      // Subtle parallax camera
      const px = (pointer.x - 0.5);
      const py = (pointer.y - 0.5);

      camera.position.x = px * 0.7;
      camera.position.y = 1.2 + py * -0.4;
      camera.lookAt(0, 0.35, 0);

      // Floating cards
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i]!;
        c.position.y = 0.55 + i * 0.05 + Math.sin(t * 1.0 + i) * 0.05;
        c.rotation.x = Math.sin(t * 0.8 + i) * 0.06;
      }

      // Accent lights breathe
      red.intensity = 0.85 + Math.sin(t * 1.2) * 0.08;
      green.intensity = 0.65 + Math.cos(t * 1.1) * 0.07;

      // Snow drift
      if (!reduced) {
        const pos = snow.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < snowCount; i++) {
          const y = pos.getY(i) - snowVel[i]! * 0.04;
          pos.setY(i, y < -0.5 ? 8.5 : y);
          pos.setX(i, pos.getX(i) + Math.sin(t * 0.25 + i) * 0.0006);
          pos.setZ(i, pos.getZ(i) + Math.cos(t * 0.2 + i) * 0.0004);
        }
        pos.needsUpdate = true;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      renderer.dispose();
      // Dispose geometries/materials
      scene.traverse((obj) => {
        const m = (obj as any).material as THREE.Material | THREE.Material[] | undefined;
        const g = (obj as any).geometry as THREE.BufferGeometry | undefined;
        if (g) g.dispose();
        if (m) {
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="landing3d" />;
}

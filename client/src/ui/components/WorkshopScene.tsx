import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type SceneMode = 'HERO' | 'PLAN' | 'REVIEW' | 'CELEBRATE';

type WorkshopSceneProps = {
  scrollProgress: number; // 0..1
  scrollVelocity: number; // px/frame-ish
  mode: SceneMode;
};

export default function WorkshopScene({ scrollProgress, scrollVelocity, mode }: WorkshopSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  // store latest values without reinitializing three
  const inputsRef = useRef({ scrollProgress: 0, scrollVelocity: 0, mode: 'HERO' as SceneMode });
  inputsRef.current.scrollProgress = scrollProgress;
  inputsRef.current.scrollVelocity = scrollVelocity;
  inputsRef.current.mode = mode;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x010102, 4.0, 16);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.6, 5.8);

    // Root group (we can subtly move/scale everything if needed)
    const root = new THREE.Group();
    scene.add(root);

    // Lights: dark ops with subtle holiday accents
    const amb = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xcfe3ff, 1.15);
    key.position.set(3.5, 6.5, 4.2);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-5, 2.5, 2.5);
    scene.add(fill);

    // Accent red/green rim lights (light Christmas vibe)
    const rimRed = new THREE.PointLight(0xff3344, 0.95, 12, 2);
    rimRed.position.set(-3.2, 1.2, 2.6);
    scene.add(rimRed);

    const rimGreen = new THREE.PointLight(0x20ff9a, 0.72, 12, 2);
    rimGreen.position.set(3.0, 1.0, 2.2);
    scene.add(rimGreen);

    // Snowy ground (cool tint, subtle speckle texture)
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 1024;
    snowCanvas.height = 1024;
    const snowCtx = snowCanvas.getContext('2d');
    if (snowCtx) {
      snowCtx.fillStyle = '#0b0f16';
      snowCtx.fillRect(0, 0, snowCanvas.width, snowCanvas.height);

      // soft snowy base
      const g = snowCtx.createRadialGradient(512, 520, 60, 512, 520, 520);
      g.addColorStop(0, 'rgba(200,220,255,0.22)');
      g.addColorStop(0.55, 'rgba(170,205,255,0.10)');
      g.addColorStop(1, 'rgba(10,12,18,0)');
      snowCtx.fillStyle = g;
      snowCtx.fillRect(0, 0, snowCanvas.width, snowCanvas.height);

      // speckles
      for (let i = 0; i < 6000; i++) {
        const x = Math.random() * snowCanvas.width;
        const y = Math.random() * snowCanvas.height;
        const a = 0.03 + Math.random() * 0.06;
        snowCtx.fillStyle = `rgba(235,245,255,${a})`;
        snowCtx.fillRect(x, y, 1, 1);
      }
    }

    const snowTex = new THREE.CanvasTexture(snowCanvas);
    snowTex.wrapS = THREE.RepeatWrapping;
    snowTex.wrapT = THREE.RepeatWrapping;
    snowTex.repeat.set(1, 1);
    snowTex.minFilter = THREE.LinearFilter;
    snowTex.magFilter = THREE.LinearFilter;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(10.2, 80),
      new THREE.MeshStandardMaterial({
        color: 0x0a0f16,
        map: snowTex,
        metalness: 0.05,
        roughness: 0.98,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    root.add(floor);

    // Holographic platform under Santa (stacked rings + scanline disc)
    const platform = new THREE.Group();
    platform.position.y = -0.795;
    root.add(platform);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x9ffcff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ringOuter = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.35, 128), ringMat);
    ringOuter.rotation.x = -Math.PI / 2;
    platform.add(ringOuter);

    const ringMid = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.15, 128),
      new THREE.MeshBasicMaterial({ ...ringMat, color: 0xffb020, opacity: 0.09 })
    );
    ringMid.rotation.x = -Math.PI / 2;
    ringMid.position.y = 0.002;
    platform.add(ringMid);

    const ringInner = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1.25, 128),
      new THREE.MeshBasicMaterial({ ...ringMat, color: 0xff3344, opacity: 0.07 })
    );
    ringInner.rotation.x = -Math.PI / 2;
    ringInner.position.y = 0.004;
    platform.add(ringInner);

    // Scanline disc
    const scanCanvas = document.createElement('canvas');
    scanCanvas.width = 512;
    scanCanvas.height = 512;
    const scanCtx = scanCanvas.getContext('2d');
    if (scanCtx) {
      scanCtx.clearRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 4) {
        scanCtx.fillStyle = `rgba(255,255,255,${0.03 + (y % 16 === 0 ? 0.02 : 0)})`;
        scanCtx.fillRect(0, y, 512, 1);
      }
    }
    const scanTex = new THREE.CanvasTexture(scanCanvas);
    scanTex.minFilter = THREE.LinearFilter;
    scanTex.magFilter = THREE.LinearFilter;

    const scanDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 128),
      new THREE.MeshBasicMaterial({ map: scanTex, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    scanDisc.rotation.x = -Math.PI / 2;
    scanDisc.position.y = 0.001;
    platform.add(scanDisc);

    // Background: aurora-like haze + stars (non-plain, still dark-premium)
    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 24),
      new THREE.MeshBasicMaterial({ color: 0x010103, transparent: true, opacity: 0.86 })
    );
    haze.position.set(0, 3.2, -10);
    root.add(haze);

    // Aurora curtain using a canvas texture (animated)
    const auroraCanvas = document.createElement('canvas');
    auroraCanvas.width = 1024;
    auroraCanvas.height = 512;
    const auroraCtx = auroraCanvas.getContext('2d');

    const auroraTex = new THREE.CanvasTexture(auroraCanvas);
    auroraTex.minFilter = THREE.LinearFilter;
    auroraTex.magFilter = THREE.LinearFilter;

    const auroraMat = new THREE.MeshBasicMaterial({
      map: auroraTex,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const aurora = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), auroraMat);
    aurora.position.set(0, 3.6, -9.8);
    root.add(aurora);

    // Low-poly hills (two layers for depth)
    function makeHills(color: number, z: number, y: number, height: number) {
      const pts: THREE.Vector2[] = [];
      const w = 22;
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const x = -w / 2 + (w / steps) * i;
        const n = Math.sin(i * 0.55) * 0.4 + Math.sin(i * 1.2) * 0.25;
        pts.push(new THREE.Vector2(x, n * height));
      }
      // close shape downwards
      pts.push(new THREE.Vector2(w / 2 + 2, -5));
      pts.push(new THREE.Vector2(-w / 2 - 2, -5));

      const shape = new THREE.Shape(pts);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, z);
      return mesh;
    }

    const hillsBack = makeHills(0x07101a, -15.5, -0.2, 1.6);
    const hillsFront = makeHills(0x050a10, -12.0, -0.9, 2.4);
    root.add(hillsBack);
    root.add(hillsFront);

    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 1] = Math.random() * 22 + 2;
      starPos[i * 3 + 2] = -12 - Math.random() * 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x9fb7d6, size: 0.018, transparent: true, opacity: 0.16, depthWrite: false });
    const stars = new THREE.Points(starGeo, starMat);
    root.add(stars);

    // Snow particles
    const snowCount = 1400;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    const snowVel = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3 + 0] = (Math.random() - 0.5) * 18;
      snowPos[i * 3 + 1] = Math.random() * 10 + 0.5;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
      snowVel[i] = 0.15 + Math.random() * 0.65;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.024,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    root.add(snow);

    // Remove in-scene branding text; keep the center clear for Santa.
    const titleGroup: THREE.Group | null = null;
    const sub: THREE.Object3D | null = null;

    // GLB Santa
    const loader = new GLTFLoader();
    let santa: THREE.Object3D | null = null;
    let headBone: THREE.Object3D | null = null;
    let torsoBone: THREE.Object3D | null = null;

    const santaUrl = '/model/santa-claus/source/Santa.glb';

    loader.load(
      santaUrl,
      (gltf) => {
        santa = gltf.scene;

        // Make sure materials look good in our lighting
        santa.traverse((obj) => {
          // capture bones for subtle pose control
          const anyObj = obj as any;
          if (anyObj.isBone && typeof obj.name === 'string') {
            if (!headBone && /head/i.test(obj.name)) headBone = obj;
            if (!torsoBone && /(spine|chest|upperchest|torso)/i.test(obj.name)) torsoBone = obj;
          }

          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
          const mats = Array.isArray(mat) ? mat : [mat];
          for (const m of mats) {
            if (!m) continue;
            m.metalness = clamp(m.metalness ?? 0.0, 0, 0.5);
            m.roughness = clamp(m.roughness ?? 0.8, 0.25, 1);
          }
        });

        // Scale + center
        const box = new THREE.Box3().setFromObject(santa);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        santa.position.sub(center);

        const targetHeight = 4.1; // slightly bigger Santa
        const scale = targetHeight / Math.max(0.0001, size.y);
        santa.scale.setScalar(scale);
        santa.position.y = -0.75; // sit on floor

        root.add(santa);
      },
      undefined,
      () => {
        // fail silently; UI still works
      }
    );

    // Mount renderer
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false; // allow page scroll; no zoom
    controls.enableRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI / 2 - 0.55;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.target.set(0, 1.15, 0);

    let lastInteract = performance.now();
    const markInteract = () => (lastInteract = performance.now());
    renderer.domElement.addEventListener('pointerdown', markInteract);
    renderer.domElement.addEventListener('wheel', markInteract);

    let width = 0;
    let height = 0;

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

    // Cursor influence (subtle)
    const pointer = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = (e.clientX - r.left) / Math.max(1, r.width);
      target.y = (e.clientY - r.top) / Math.max(1, r.height);
      // mark interaction so auto-rotate pauses while user is active
      lastInteract = performance.now();
    };
    window.addEventListener('pointermove', onMove, { passive: true });

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

    let raf = 0;

    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();

      // Inputs (scroll + cursor) with gentle inertia
      const input = inputsRef.current;
      pointer.x = lerp(pointer.x, target.x, 0.05);
      pointer.y = lerp(pointer.y, target.y, 0.05);
      const px = pointer.x - 0.5;
      const py = pointer.y - 0.5;

      // Scroll-linked hero rotation (Giulio-style): Santa turns with scroll progress
      const scrollTurn = (input.scrollProgress - 0.5) * 0.9; // ~[-0.45..0.45]
      if (santa) santa.rotation.y = scrollTurn;

      // Scroll velocity gives subtle camera push/pull (calm, not chaotic)
      const v = clamp(input.scrollVelocity, -40, 40);
      const vNorm = v / 40;
      camera.position.z = 5.8 + vNorm * 0.24;

      // Cursor: slight head/torso tracking (tight limit)
      const yaw = clamp(px * 0.22, -0.18, 0.18);
      const pitch = clamp(-py * 0.18, -0.14, 0.14);
      if (headBone) {
        headBone.rotation.y = lerp(headBone.rotation.y, yaw, 0.10);
        headBone.rotation.x = lerp(headBone.rotation.x, pitch, 0.10);
      }
      if (torsoBone) {
        torsoBone.rotation.y = lerp(torsoBone.rotation.y, yaw * 0.55, 0.08);
        torsoBone.rotation.x = lerp(torsoBone.rotation.x, pitch * 0.35, 0.08);
      }

      // Keep center clear; no in-scene text drift

      // Context-aware scene mode: posture / lighting "mood"
      // (We keep this restrained: small shifts only.)
      if (input.mode === 'PLAN') {
        rimGreen.intensity = 0.78 + Math.cos(t * 1.05) * 0.06;
        rimRed.intensity = 0.62 + Math.sin(t * 1.1) * 0.05;
      } else if (input.mode === 'REVIEW') {
        rimGreen.intensity = 0.58 + Math.cos(t * 1.05) * 0.05;
        rimRed.intensity = 0.78 + Math.sin(t * 1.1) * 0.06;
      } else if (input.mode === 'CELEBRATE') {
        rimGreen.intensity = 0.80 + Math.cos(t * 1.25) * 0.09;
        rimRed.intensity = 0.82 + Math.sin(t * 1.2) * 0.09;
      } else {
        rimRed.intensity = 0.80 + Math.sin(t * 1.1) * 0.08;
        rimGreen.intensity = 0.62 + Math.cos(t * 1.05) * 0.07;
      }

      // animate holographic platform (colorful)
      const pulse = 0.10 + Math.max(0, Math.sin(t * 0.9)) * 0.14;
      ringOuter.material.opacity = pulse;
      (ringMid.material as THREE.MeshBasicMaterial).opacity = pulse * 0.85;
      (ringInner.material as THREE.MeshBasicMaterial).opacity = pulse * 0.70;
      scanDisc.material.opacity = 0.10 + Math.max(0, Math.sin(t * 1.1)) * 0.10;

      // hue cycle (lighter + more attractive): cyan → magenta → amber
      const hue = (t * 0.035) % 1;
      (ringOuter.material as THREE.MeshBasicMaterial).color.setHSL((hue + 0.50) % 1, 0.95, 0.66);
      (ringMid.material as THREE.MeshBasicMaterial).color.setHSL((hue + 0.86) % 1, 0.95, 0.64);
      (ringInner.material as THREE.MeshBasicMaterial).color.setHSL((hue + 0.10) % 1, 0.95, 0.62);

      // slow rotation
      platform.rotation.y = t * 0.12;

      // Idle auto-rotate when not interacting (very gentle)
      const idleMs = performance.now() - lastInteract;
      if (!reduced && idleMs > 1500) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.28;
      } else {
        controls.autoRotate = false;
      }

      // Animate aurora texture
      if (auroraCtx) {
        const w = auroraCanvas.width;
        const h = auroraCanvas.height;
        auroraCtx.clearRect(0, 0, w, h);

        // base dark gradient
        const bg = auroraCtx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, 'rgba(5,6,7,0.0)');
        bg.addColorStop(0.2, 'rgba(8,14,24,0.25)');
        bg.addColorStop(0.55, 'rgba(12,24,45,0.18)');
        bg.addColorStop(1, 'rgba(5,6,7,0.0)');
        auroraCtx.fillStyle = bg;
        auroraCtx.fillRect(0, 0, w, h);

        // moving ribbons
        for (let i = 0; i < 6; i++) {
          const phase = t * 0.25 + i * 0.7;
          const x = ((Math.sin(phase) * 0.5 + 0.5) * w) | 0;
          const bandW = 220 + Math.sin(t * 0.4 + i) * 60;
          const grad = auroraCtx.createLinearGradient(x - bandW, 0, x + bandW, 0);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.35, 'rgba(32,255,154,0.08)');
          grad.addColorStop(0.55, 'rgba(255,176,32,0.06)');
          grad.addColorStop(0.75, 'rgba(255,51,68,0.05)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          auroraCtx.fillStyle = grad;
          auroraCtx.fillRect(0, 0, w, h);
        }
        auroraTex.needsUpdate = true;
      }

      // Snow drift
      if (!reduced) {
        const pos = snow.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < snowCount; i++) {
          const y = pos.getY(i) - snowVel[i]! * 0.04;
          pos.setY(i, y < -0.6 ? 10.5 : y);
          pos.setX(i, pos.getX(i) + Math.sin(t * 0.25 + i) * 0.0007);
          pos.setZ(i, pos.getZ(i) + Math.cos(t * 0.2 + i) * 0.0005);
        }
        pos.needsUpdate = true;
      }

      // Subtle Santa presentation: lightly bob + very small breathing tilt
      if (santa && !reduced) {
        santa.position.y = -0.75 + Math.sin(t * 0.6) * 0.01;
        santa.rotation.x = Math.sin(t * 0.35) * 0.01;
      }

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);

      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);

      renderer.domElement.removeEventListener('pointerdown', markInteract);
      renderer.domElement.removeEventListener('wheel', markInteract);

      ro.disconnect();
      controls.dispose();

      scene.traverse((obj) => {
        const g = (obj as any).geometry as THREE.BufferGeometry | undefined;
        const m = (obj as any).material as THREE.Material | THREE.Material[] | undefined;
        if (g) g.dispose();
        if (m) {
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();

      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="landing3d" />;
}

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

export default function WorkshopScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050607, 5, 20);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.5, 7.2);

    // Root group (we can subtly move/scale everything if needed)
    const root = new THREE.Group();
    scene.add(root);

    // Lights: dark ops with subtle holiday accents
    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xcfe3ff, 1.0);
    key.position.set(3.5, 6.5, 4.2);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-5, 2.5, 2.5);
    scene.add(fill);

    // Accent red/green rim lights (light Christmas vibe)
    const rimRed = new THREE.PointLight(0xff3344, 0.85, 12, 2);
    rimRed.position.set(-3.2, 1.2, 2.6);
    scene.add(rimRed);

    const rimGreen = new THREE.PointLight(0x20ff9a, 0.65, 12, 2);
    rimGreen.position.set(3.0, 1.0, 2.2);
    scene.add(rimGreen);

    // Floor (obsidian, slightly reflective look)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 64),
      new THREE.MeshStandardMaterial({ color: 0x070a0d, metalness: 0.25, roughness: 0.86 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    root.add(floor);

    // Subtle ring glow (fake reflection / aura)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2.2, 96),
      new THREE.MeshBasicMaterial({
        color: 0x20ff9a,
        transparent: true,
        opacity: 0.10,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.795;
    root.add(ring);

    // Back haze plane to help depth (keeps it premium)
    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 18),
      new THREE.MeshBasicMaterial({ color: 0x050607, transparent: true, opacity: 0.35 })
    );
    haze.position.set(0, 3.0, -9);
    root.add(haze);

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
      size: 0.025,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    root.add(snow);

    // 3D "text" without loading fonts: use planes with canvas textures.
    // Title as "extruded" illusion by layering multiple planes.
    function makeTextTexture(text: string, opts: { size: number; color: string; glow?: string; weight?: number }) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D context missing');

      const padding = 80;
      canvas.width = 2048;
      canvas.height = 512;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${opts.weight ?? 900} ${opts.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

      // glow
      if (opts.glow) {
        ctx.shadowColor = opts.glow;
        ctx.shadowBlur = 40;
      }
      ctx.fillStyle = opts.color;
      ctx.fillText(text, padding, canvas.height / 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    }

    function makeTextPlane(tex: THREE.Texture, w: number, h: number, opacity: number, additive = false) {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    }

    const titleTex = makeTextTexture('NORTH-COMMAND', { size: 170, color: 'rgba(255,255,255,0.95)', glow: 'rgba(32,255,154,0.25)' });
    const titleGroup = new THREE.Group();

    // layer planes slightly behind to fake extrusion
    for (let i = 0; i < 7; i++) {
      const p = makeTextPlane(titleTex, 4.6, 1.1, 0.10 + i * 0.06, true);
      p.position.z = -i * 0.01;
      p.position.y = -i * 0.002;
      titleGroup.add(p);
    }

    titleGroup.position.set(0, 2.45, -0.2);
    titleGroup.rotation.x = -0.08;
    root.add(titleGroup);

    const subTex = makeTextTexture('SANTA WORKSHOP • REALTIME TASK CONTROL', {
      size: 86,
      color: 'rgba(255,176,32,0.90)',
      glow: 'rgba(255,176,32,0.20)',
      weight: 800,
    });
    const sub = makeTextPlane(subTex, 4.0, 0.55, 0.75, true);
    sub.position.set(0, 1.75, 0.2);
    sub.rotation.x = -0.06;
    root.add(sub);

    // GLB Santa
    const loader = new GLTFLoader();
    let santa: THREE.Object3D | null = null;

    const santaUrl = '/model/santa-claus/source/Santa.glb';

    loader.load(
      santaUrl,
      (gltf) => {
        santa = gltf.scene;

        // Make sure materials look good in our lighting
        santa.traverse((obj) => {
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

        const targetHeight = 2.6;
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
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI / 2 - 0.55;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.target.set(0, 0.9, 0);

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

    // Cursor influence (subtle), separate from orbit
    const pointer = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = (e.clientX - r.left) / Math.max(1, r.width);
      target.y = (e.clientY - r.top) / Math.max(1, r.height);
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

      // Cursor parallax
      pointer.x = lerp(pointer.x, target.x, 0.05);
      pointer.y = lerp(pointer.y, target.y, 0.05);
      const px = pointer.x - 0.5;
      const py = pointer.y - 0.5;

      titleGroup.position.x = px * 0.25;
      sub.position.x = px * 0.18;
      ring.material.opacity = 0.08 + Math.max(0, Math.sin(t * 0.9)) * 0.06;

      // Idle auto-rotate when not interacting
      const idleMs = performance.now() - lastInteract;
      if (!reduced && idleMs > 1800) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.55;
      } else {
        controls.autoRotate = false;
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

      // Breathe accent lights
      rimRed.intensity = 0.80 + Math.sin(t * 1.1) * 0.08;
      rimGreen.intensity = 0.62 + Math.cos(t * 1.05) * 0.07;

      // Subtle Santa presentation: if loaded, lightly bob
      if (santa && !reduced) {
        santa.rotation.y = santa.rotation.y; // left to controls (rotates camera)
        santa.position.y = -0.75 + Math.sin(t * 0.6) * 0.01;
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

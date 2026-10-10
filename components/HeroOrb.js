"use client";
import { useEffect, useRef } from "react";

import { site } from "@/lib/site.config";

/**
 * HeroOrb — A large torus ring made of thousands of particles.
 * The ring edge is turbulent / wavy like the getlayers.ai "new-era" template.
 * Brand colors: deep green → lime → teal.
 */
export default function HeroOrb() {
  const showInfinity = site.showInfinity;
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let THREE, renderer, scene, camera, particles, geo, mat;
    let raf;
    let disposed = false;
    let morph = null;
    let lastTime = 0;
    let dotTexture;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let W = window.innerWidth;
    let H = window.innerHeight;
    const mouse = { x: 0, y: 0 };
    const smoothMouse = { x: 0, y: 0 };

    // --- Organic turbulence noise (sum of sin waves) ---
    // This creates the fluid, waving molecule effect on the stationary ring
    function turbulence(u, v, t) {
      return (
        Math.sin(u * 6 + t * 1.2) * Math.sin(v * 3 - t * 0.8) * 0.35 +
        Math.cos(u * 12 - t * 1.5) * Math.sin(v * 6 + t * 1.1) * 0.15 +
        Math.sin(u * 4 + t * 0.5) * Math.cos(v * 2 - t * 0.4) * 0.20
      );
    }

    const init = async () => {
      THREE = await import("three");
      if (disposed) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
      camera.position.z = 3.8;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, W < 768 ? 1.5 : 2));
      renderer.setClearColor(0x000000, 0);
      mountRef.current?.appendChild(renderer.domElement);

      // ── Particle counts & torus params ──────────────────
      const RING_PARTICLES = W < 768 ? 4000 : 8000;  // particles on the main ring
      const SPRAY_PARTICLES = W < 768 ? 1000 : 2000;  // extra "spray" off the ring edge
      const TOTAL = RING_PARTICLES + SPRAY_PARTICLES;

      const R_MAJOR = 1.75;   // torus major radius (increased to make circle bigger)
      const R_TUBE = 0.38;   // torus tube radius

      const positions = new Float32Array(TOTAL * 3);
      const colors = new Float32Array(TOTAL * 4);
      const metadata = new Float32Array(TOTAL * 4); // u, v, tubeT, isSpray

      // Pure brand palette (Dark Green → Green → Lime)
      const cGreen = new THREE.Color("#16A34A"); // brand-600
      const cLime = new THREE.Color("#86EFAC"); // brand-300
      const cTeal = new THREE.Color("#22C55E"); // brand-500 (replaces teal)
      const cDeep = new THREE.Color("#064E3B"); // brand-900

      for (let i = 0; i < TOTAL; i++) {
        const isSpray = i >= RING_PARTICLES ? 1 : 0;
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        // tubeT: 0 = inner tube wall, 1 = outer
        const tubeT = isSpray
          ? 0.6 + Math.random() * 0.7   // spray particles pushed outward
          : Math.random();

        metadata[i * 4] = u;
        metadata[i * 4 + 1] = v;
        metadata[i * 4 + 2] = tubeT;
        metadata[i * 4 + 3] = isSpray;

        // Base torus position (will be animated each frame)
        const r = R_MAJOR + R_TUBE * tubeT * Math.cos(v);
        positions[i * 3] = r * Math.cos(u);
        positions[i * 3 + 1] = r * Math.sin(u);
        positions[i * 3 + 2] = R_TUBE * tubeT * Math.sin(v);

        // Color: gradient by u angle + tubeT
        const angleT = (Math.sin(u) * 0.5 + 0.5);
        let c;
        if (isSpray) {
          c = cLime.clone().lerp(cTeal, Math.random());
        } else if (angleT < 0.33) {
          c = cDeep.clone().lerp(cGreen, tubeT);
        } else if (angleT < 0.66) {
          c = cGreen.clone().lerp(cLime, (angleT - 0.33) * 3);
        } else {
          c = cLime.clone().lerp(cTeal, (angleT - 0.66) * 3);
        }
        // Spray particles are brighter
        if (isSpray) c.multiplyScalar(1.4);

        colors[i * 4] = c.r;
        colors[i * 4 + 1] = c.g;
        colors[i * 4 + 2] = c.b;
        colors[i * 4 + 3] = 1;
      }

      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
      geo.userData.metadata = metadata;
      geo.userData.baseColors = colors.slice();
      geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
      geo.attributes.color.setUsage(THREE.DynamicDrawUsage);

      // Round soft glow dot sprite
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = dotCanvas.height = 128;
      const dc = dotCanvas.getContext("2d");

      const grad = dc.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.25, "rgba(255, 255, 255, 0.7)"); // Softer core brightness
      grad.addColorStop(0.65, "rgba(255, 255, 255, 0.15)"); // Softer mid brightness
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");

      dc.fillStyle = grad;
      dc.fillRect(0, 0, 128, 128);

      dotTexture = new THREE.CanvasTexture(dotCanvas);
      dotTexture.needsUpdate = true;

      mat = new THREE.PointsMaterial({
        size: 0.025, // Slightly reduced size for a softer overlap
        vertexColors: true,
        map: dotTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending, // This creates the glowing effect when molecules overlap
        sizeAttenuation: true,
        opacity: 0.45, // Slightly reduced opacity for a lighter, balanced glow
      });

      particles = new THREE.Points(geo, mat);
      particles.frustumCulled = false;
      scene.add(particles);

      animate();
    };

    const startTime = Date.now();

    const animate = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      const hero = document.getElementById("top");
      const services = document.getElementById("services");
      const anchor = document.querySelector("[data-molecule-destination]");
      if (!hero || !services || !anchor) { raf = requestAnimationFrame(animate); return; }
      const hr = hero.getBoundingClientRect();
      const sr = services.getBoundingClientRect();
      const ar = anchor.getBoundingClientRect();
      const why = document.getElementById("why-code-molecule");
      const framework = document.querySelector("[data-framework-destination]");
      const whyRect = why?.getBoundingClientRect();
      const frameworkRect = framework?.getBoundingClientRect();
      const frameworkNodes = framework ? Array.from(framework.querySelectorAll("[data-framework-row]"), (row) => row.getBoundingClientRect()) : [];
      const frameworkOpen = Math.max(0, Math.min(1, Number(framework?.dataset.frameworkOpen || 0)));
      const transferRaw = whyRect && frameworkRect && !reducedMotion.matches
        ? Math.max(0, Math.min(1, (H * 0.85 - whyRect.top) / (H * 0.65))) : 0;
      const transfer = transferRaw * transferRaw * (3 - 2 * transferRaw);
      const frameworkVisible = Boolean(whyRect && whyRect.bottom > 0 && whyRect.top < H);
      const target = Math.max(0, Math.min(1, (H * 0.92 - sr.top) / (H * 0.8)));
      const reduced = reducedMotion.matches;
      if (morph === null || reduced) morph = target;
      else morph += (target - morph) * (1 - Math.exp(-12 * dt));
      const blend = morph ** 3 * (morph * (morph * 6 - 15) + 10);
      const halfH = 3.8 * Math.tan(52 * Math.PI / 360);
      const worldPerPixel = halfH * 2 / H;
      const desktop = W >= 1024;
      let span = desktop ? Math.min(240, ar.width * 0.16) : Math.min(180, W * 0.55);
      let centerX = ((desktop ? ar.left + span * 0.5 - 40 : (W / 2) - 20) - W / 2) * worldPerPixel;
      let centerY = (H / 2 - ar.top - (desktop ? 164 : 48)) * worldPerPixel;
      const heroY = (H / 2 - hr.top - hr.height / 2) * worldPerPixel * (1 - blend);
      mountRef.current.style.visibility = hr.bottom > 0 || sr.bottom > 0 || (transfer > 0 && frameworkVisible) ? "visible" : "hidden";
      raf = requestAnimationFrame(animate);
      const t = reduced ? 0 : (Date.now() - startTime) / 1000;

      if ((sr.bottom <= 0 && !(transfer > 0 && frameworkVisible)) || document.hidden) return;

      // Stable particle ribbons, from circle perimeter to circle perimeter.
      // These particles belong to the hero ring too: no second cloud is spawned.
      let cardsContainer;
      if (showInfinity) {
        cardsContainer = desktop ? services.querySelector(".hidden.lg\\:block[data-molecule-cards]") : services.querySelector(".block.lg\\:hidden[data-molecule-cards]");
      } else {
        cardsContainer = services.querySelector("[data-molecule-cards]");
      }
      const cardNodes = cardsContainer ? cardsContainer.querySelectorAll("[data-molecule-card]") : [];
      const cards = Array.from(cardNodes, (node) => {
        const rect = node.getBoundingClientRect();
        return { 
          x: (rect.left + rect.width / 2 - W / 2) * worldPerPixel,
          y: (H / 2 - rect.top - rect.height / 2) * worldPerPixel,
          width: rect.width * worldPerPixel,
          height: rect.height * worldPerPixel,
          radius: Math.max(rect.width, rect.height) * 0.5 * worldPerPixel 
        };
      });
      const segments = [];
      if (cards.length === 6 && showInfinity) {
        let chain;
        if (desktop) {
          const available = (cards[0].x - cards[0].radius) / worldPerPixel + W / 2 - ar.left - 24;
          span = Math.min(span, Math.max(64, available * 0.85));
          centerY = cards[0].y;
          // Keep the infinity and its first bridge clear of the first card.
          centerX = Math.min(centerX, cards[0].x - cards[0].radius - span * 0.58 * worldPerPixel - 18 * worldPerPixel);
          const tip = { x: centerX + span * 0.5 * worldPerPixel, y: centerY, radius: 0 };
          chain = [tip, cards[0], cards[3], cards[1], cards[4], cards[2], cards[5]];
        } else {
          span = Math.min(130, W * 0.38);
          centerX = -W * 0.22 * worldPerPixel; // Shift left more
          // Place infinity above the first card, closer to it
          centerY = cards[0].y + cards[0].radius + span * 0.35 * worldPerPixel + 2 * worldPerPixel;
          const tip = { x: centerX + span * 0.5 * 0.707 * worldPerPixel, y: centerY - span * 0.23 * worldPerPixel, radius: 0 };
          chain = [tip, cards[0], cards[1], cards[2], cards[3], cards[4], cards[5]];
        }
        for (let n = 0; n < chain.length - 1; n++) {
          const from = chain[n], to = chain[n + 1];
          const dx = to.x - from.x, dy = to.y - from.y;
          const length = Math.hypot(dx, dy) || 1;
          // Let the last molecules rest just inside each card edge.
          const gap = -18 * worldPerPixel;
          const startInset = from.radius ? gap : 0;
          const start = { x: from.x + dx / length * (from.radius + startInset), y: from.y + dy / length * (from.radius + startInset) };
          const end = { x: to.x - dx / length * (to.radius + gap), y: to.y - dy / length * (to.radius + gap) };
          segments.push({ start, end });
        }
      }
      const color = geo.attributes.color;
      const baseColors = geo.userData.baseColors;
      mat.size = 0.038 * (1 - blend * 0.2);

      // Smooth mouse lerp
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;

      // Keep the ring stationary (sthir) facing forward. 
      // Only a very tiny tilt on mouse hover to feel 3D, no continuous spinning.
      const parallaxAmount = showInfinity ? (1 - blend * 0.7) : 1;
      particles.rotation.y = smoothMouse.x * 0.15 * parallaxAmount;
      particles.rotation.x = smoothMouse.y * 0.15 * parallaxAmount;
      particles.rotation.z = 0;

      // Animate positions using turbulence noise so molecules wave
      const pos = geo.attributes.position;
      const meta = geo.userData.metadata;
      const N = pos.count;

      const R_MAJOR = 1.75;
      const R_TUBE = 0.38;

      for (let i = 0; i < N; i++) {
        const u = meta[i * 4];
        const v = meta[i * 4 + 1];
        const tubeT = meta[i * 4 + 2];
        const isSpray = meta[i * 4 + 3];

        // Turbulence displacement — waves on the ring surface
        const noiseAmt = isSpray ? 0.65 : 0.35; // increased amplitude for visible fluid motion
        const noise = turbulence(u, v, t) * noiseAmt;
        const effectiveTube = tubeT + noise;

        const r = R_MAJOR + R_TUBE * effectiveTube * Math.cos(v);
        let ix = 0, iy = 0, iz = 0;
        let destinationBrightness = 0;
        let targetAlpha = 1;
        let ribbonParticle = false;

        if (showInfinity) {
          const a = span * 0.5 * worldPerPixel;
          const b = span * 0.23 * worldPerPixel;
          const tx = -a * Math.sin(u), ty = 2 * b * Math.cos(2 * u);
          const len = Math.hypot(tx, ty) || 1;
          const tube = span * 0.065 * worldPerPixel * effectiveTube;
          ix = centerX + a * Math.cos(u) - ty / len * tube * Math.cos(v);
          iy = centerY + b * Math.sin(2 * u) + tx / len * tube * Math.cos(v);
          iz = tube * Math.sin(v);
          
          const baseBrightness = desktop ? 0.20 : 0.1;
          destinationBrightness = i % 7 === 0 ? 0.05 : baseBrightness;
          
          const ribbonMod = 6;
          ribbonParticle = i % ribbonMod === 0;

          if (ribbonParticle && segments.length) {
            const ribbonIndex = Math.floor(i / ribbonMod);
            const segment = segments[ribbonIndex % segments.length];
            const q = u / (Math.PI * 2);
            const { start, end } = segment;
            const dx = end.x - start.x, dy = end.y - start.y;
            const length = Math.hypot(dx, dy) || 1;
            const envelope = 0.72 + 0.28 * Math.sin(q * Math.PI);
            const bend = (Math.sin(q * 8 + t * 0.4) * 4 + Math.sin(q * 21 - t * 0.3) * 2) * worldPerPixel;
            const streamTube = (5.5 + 8.5 * Math.max(0, effectiveTube)) * worldPerPixel * envelope;
            const spread = Math.cos(v) * streamTube;
            const along = Math.sin(v) * 3 * worldPerPixel;
            ix = start.x + dx * q + dx / length * along - dy / length * (bend + spread);
            iy = start.y + dy * q + dy / length * along + dx / length * (bend + spread);
            iz = Math.sin(v) * streamTube * 0.28;
            destinationBrightness = 0.2 + 0.1 * (Math.sin(i * 3.71 + t * 0.65) * 0.5 + 0.5);
          }
          
          if (!ribbonParticle || (!segments.length && ribbonParticle)) {
             if (!segments.length && ribbonParticle) {
               targetAlpha = 0;
             }
          }
        } else {
          // Particles scatter outwards and vanish (fly away)
          const spanX = W * 2.5 * worldPerPixel; // wider spread
          const spanY = Math.max(H * 2.5, sr.height * 2.5) * worldPerPixel;
          
          // True uniform pseudo-random distribution using modulo
          const randX = ((u * 1234.5678) % 1.0) - 0.5;
          const randY = ((v * 8765.4321) % 1.0) - 0.5;
          const randZ = (((u + v) * 5432.1098) % 1.0) - 0.5;
          
          // Drift movement
          const driftX = Math.sin(t * 0.4 + u * 3) * 6 * worldPerPixel;
          const driftY = Math.cos(t * 0.35 + v * 3) * 6 * worldPerPixel;
          
          ix = randX * spanX + driftX;
          iy = (H / 2 - sr.top - sr.height / 2) * worldPerPixel + randY * spanY + driftY;
          iz = (randZ * 30 + 15) * worldPerPixel; // fly towards the camera
          
          destinationBrightness = 0.8;
          targetAlpha = -0.2; // push below 0 so they fully vanish before scroll ends
        }
        // The bridges emerge just after the infinity begins to form.
        const local = ribbonParticle && segments.length
          ? Math.max(0, Math.min(1, (morph - 0.08) / 0.92)) : morph;
        const particleBlend = ribbonParticle && segments.length
          ? local ** 3 * (local * (local * 6 - 15) + 10) : blend;
        const unifiedScale = W < 768 
          ? Math.min(1, hr.height * worldPerPixel / 5.5) 
          : Math.min(1, W * worldPerPixel / 4.8, hr.height * worldPerPixel / 4.8);
        const hx = r * Math.cos(u) * unifiedScale, hy = heroY + r * Math.sin(u) * unifiedScale;
        const arc = Math.sin(particleBlend * Math.PI) * Math.sin(u) * 0.15;
        pos.setXYZ(i,
          hx + (ix - hx) * particleBlend,
          hy + (iy - hy) * particleBlend + arc,
          R_TUBE * effectiveTube * Math.sin(v) * unifiedScale * (1 - particleBlend) + iz * particleBlend
        );
        let brightness = 1 + (destinationBrightness - 1) * particleBlend;
        if (transfer > 0 && frameworkRect) {
          // The existing cloud resolves into a restrained four-node framework.
          const q = u / (Math.PI * 2);
          const node = frameworkNodes[Math.floor(i / 4) % 4];
          const first = frameworkNodes[0];
          const last = frameworkNodes[frameworkNodes.length - 1];
          if (node && first && last) {
            const axisX = frameworkRect.left + 8;
            const nodeY = node.top + node.height / 2;
            const group = i % 4;
            let pixelX = axisX;
            let pixelY = nodeY;
            if (group === 0) {
              pixelY = first.top + first.height / 2 + q * (last.top + last.height / 2 - first.top - first.height / 2);
              pixelX += Math.cos(v) * 1.8;
            } else if (group === 1) {
              pixelX += q * (node.left - axisX);
              pixelY += Math.cos(v) * 1.5;
            } else {
              pixelX += Math.cos(u) * (5 + tubeT * 2);
              pixelY += Math.sin(u) * (5 + tubeT * 2);
            }
            const frameworkX = (pixelX - W / 2) * worldPerPixel;
            const frameworkY = (H / 2 - pixelY) * worldPerPixel;
            pos.setXYZ(i,
              pos.getX(i) + (frameworkX - pos.getX(i)) * transfer,
              pos.getY(i) + (frameworkY - pos.getY(i)) * transfer,
              pos.getZ(i) * (1 - transfer));
          }
          const weaveBrightness = i % 11 === 0 ? 0.28 * (1 - frameworkOpen * 0.65) : 0;
          brightness += (weaveBrightness - brightness) * transfer;
        }
        color.setW(i, Math.max(0, 1 + (targetAlpha - 1) * particleBlend));
        color.setXYZ(i, baseColors[i * 4] * brightness, baseColors[i * 4 + 1] * brightness, baseColors[i * 4 + 2] * brightness);
      }
      pos.needsUpdate = true;
      color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    const onMouseMove = (e) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onResize = () => {
      if (!renderer || !camera || !mountRef.current) return;
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, W < 768 ? 1.5 : 2));
      renderer.setSize(W, H);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    init().catch(() => {
      // Keep all page content usable when WebGL is unavailable.
      disposed = true;
      cancelAnimationFrame(raf);
      mount.style.visibility = "hidden";
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      dotTexture?.dispose();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      geo?.dispose();
      mat?.dispose();
      renderer?.dispose();
      if (renderer?.domElement) {
        try { mount.removeChild(renderer.domElement); } catch { }
      }
    };
  }, []);

  return (
    <div ref={mountRef} className="pointer-events-none fixed inset-0 z-20" aria-hidden="true" />
  );
}

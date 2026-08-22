"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SceneControl = { progress: number; started: boolean };
export type ScenePointer = { x: number; y: number; isDown: boolean };

type PaletteRole = "pastel" | "light" | "medium" | "deep" | "glass";
type Palette = Record<PaletteRole, THREE.Color>;

type Ball = {
  id: number;
  radius: number;
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  meshGroup: THREE.Group;
  sphere: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  role: PaletteRole;
  isGlass: boolean;
  visualScale: number;
  color: THREE.Color;
  restPosition: THREE.Vector3;
  shapeTarget: THREE.Vector3;
  angleY: number;
  angleZ: number;
};

const getDynamicColors = (baseColor: string): Palette => {
  const hex = baseColor.toLowerCase();
  if (hex === "#e1fc03") {
    return {
      pastel: new THREE.Color("#FBFFE2"),
      light: new THREE.Color("#EFFE69"),
      medium: new THREE.Color("#E1FC03"),
      deep: new THREE.Color("#B1E200"),
      glass: new THREE.Color("#DCFF32"),
    };
  } else if (hex === "#ffc5c2" || hex === "#ffa19e") {
    return {
      pastel: new THREE.Color("#FFF5F4"),
      light: new THREE.Color("#FFECEB"),
      medium: new THREE.Color("#FFA6B3"),
      deep: new THREE.Color("#FF4D6D"),
      glass: new THREE.Color("#FFA6B3"),
    };
  } else if (hex === "#96e5ff") {
    return {
      pastel: new THREE.Color("#F0F9FF"),
      light: new THREE.Color("#C9F1FF"),
      medium: new THREE.Color("#96E5FF"),
      deep: new THREE.Color("#2BA5FF"),
      glass: new THREE.Color("#98E4FF"),
    };
  } else if (hex === "#2f69ff") {
    return {
      pastel: new THREE.Color("#ECEFFF"),
      light: new THREE.Color("#A8C1FF"),
      medium: new THREE.Color("#2F69FF"),
      deep: new THREE.Color("#0A33BF"),
      glass: new THREE.Color("#4D80FF"),
    };
  } else if (hex === "#141414" || hex === "#000000") {
    return {
      pastel: new THREE.Color("#D8D8D8"),
      light: new THREE.Color("#555555"),
      medium: new THREE.Color("#242424"),
      deep: new THREE.Color("#0A0A0A"),
      glass: new THREE.Color("#1F1F1F"),
    };
  }
  const c = new THREE.Color(baseColor);
  return {
    pastel: c.clone().offsetHSL(0, -0.15, 0.25),
    light: c.clone().offsetHSL(0, -0.05, 0.12),
    medium: c.clone(),
    deep: c.clone().offsetHSL(0.01, 0.1, -0.12),
    glass: c.clone(),
  };
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function GravityScene({
  ballColor,
  controlRef,
  mouseRef,
  onReady,
}: {
  ballColor: string;
  controlRef: React.MutableRefObject<SceneControl>;
  mouseRef: React.MutableRefObject<ScenePointer>;
  onReady: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 11);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      // WebGL unavailable (blocklisted GPU, disabled, some VMs) — release the
      // loader so the page content (and the login path) still works without
      // the 3D field, instead of a blank page stuck at 92%.
      console.error("WebGL init failed, continuing without the gravity field:", err);
      container.removeChild(canvas);
      onReadyRef.current();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemiLight = new THREE.HemisphereLight(0xffffff, new THREE.Color(ballColor), 1.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(-6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 12.0;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.25);
    rimLight.position.set(8, 7, -8);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
    frontLight.position.set(0, 0, 11);
    scene.add(frontLight);

    const sideBounceLight = new THREE.DirectionalLight(0xffffff, 0.3);
    sideBounceLight.position.set(-9, -2, 4);
    scene.add(sideBounceLight);

    let viewportWidth = 10;
    let viewportHeight = 6;
    const updateFrustumBounds = () => {
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewportWidth = viewportHeight * (container.clientWidth / container.clientHeight);
    };
    updateFrustumBounds();

    const isMobile = window.innerWidth < 768;
    const ballCount = isMobile ? 54 : 96;

    const palette = getDynamicColors(ballColor);
    const isBlack = ["#141414", "#18181b", "#000000"].includes(ballColor.toLowerCase());

    // Scroll-driven palettes: hero (base) → volt-lime (drop) → rose-pink (heart).
    const palHero = palette;
    const palLime = getDynamicColors("#E1FC03");
    const palPink = getDynamicColors("#FFC5C2");
    const ROLES: PaletteRole[] = ["pastel", "light", "medium", "deep", "glass"];
    const curPal: Palette = {
      pastel: new THREE.Color(),
      light: new THREE.Color(),
      medium: new THREE.Color(),
      deep: new THREE.Color(),
      glass: new THREE.Color(),
    };

    const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
    const balls: Ball[] = [];
    for (let i = 0; i < ballCount; i++) {
      let radius = 0.33;
      const rand = Math.random();
      if (rand < 0.3) radius = 0.27 + Math.random() * 0.12;
      else if (rand < 0.8) radius = 0.42 + Math.random() * 0.18;
      else radius = 0.66 + Math.random() * 0.21;

      const mass = Math.pow(radius, 3);

      let chosenColor = palette.medium;
      let color = palette.medium;
      let sphereMat: THREE.MeshPhysicalMaterial;
      let role: PaletteRole = "medium";

      const isGlass = Math.random() < 0.22 && !isBlack;

      if (isGlass) {
        sphereMat = new THREE.MeshPhysicalMaterial({
          color: palette.glass,
          roughness: 0.08,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          transmission: 0.95,
          ior: 1.485,
          thickness: 2.2,
          specularColor: new THREE.Color("#ffffff"),
          specularIntensity: 1.0,
          attenuationColor: palette.pastel,
          attenuationDistance: 1.0,
          emissive: palette.glass,
          emissiveIntensity: 0.12,
          transparent: true,
        });
        color = palette.glass;
        role = "glass";
      } else {
        const colorRand = Math.random();
        if (colorRand < 0.25) {
          chosenColor = palette.pastel;
          role = "pastel";
        } else if (colorRand < 0.55) {
          chosenColor = palette.light;
          role = "light";
        } else if (colorRand < 0.85) {
          chosenColor = palette.medium;
          role = "medium";
        } else {
          chosenColor = palette.deep;
          role = "deep";
        }

        sphereMat = new THREE.MeshPhysicalMaterial({
          color: chosenColor,
          roughness: 0.44,
          metalness: 0.0,
          clearcoat: 0.24,
          clearcoatRoughness: 0.35,
          emissive: isBlack ? new THREE.Color("#000000") : chosenColor,
          emissiveIntensity: isBlack ? 0.0 : 0.08,
          transparent: true,
        });
        color = chosenColor;
      }

      const group = new THREE.Group();
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
      sphereMesh.scale.setScalar(radius);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      group.add(sphereMesh);
      scene.add(group);

      balls.push({
        id: i,
        radius,
        mass,
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(),
        meshGroup: group,
        sphere: sphereMesh,
        material: sphereMat,
        role,
        isGlass,
        visualScale: radius,
        color,
        restPosition: new THREE.Vector3(0, 0, 0),
        shapeTarget: new THREE.Vector3(),
        angleY: Math.random() * Math.PI * 2,
        angleZ: 0.1 + Math.random() * 0.45,
      });
    }

    const meanRadius = balls.reduce((sum, b) => sum + b.radius, 0) / balls.length;
    let shapeScale = 1;

    // Heart silhouette: fill (x²+y²−1)³ − x²y³ ≤ 0 by rejection sampling.
    const inHeart = (x: number, y: number) => {
      const a = x * x + y * y - 1;
      return a * a * a - x * x * y * y * y <= 0;
    };
    const assignHeartTargets = () => {
      const S = Math.min(viewportWidth * 0.3, viewportHeight * 0.27);
      const baseCY = -viewportHeight * 0.03;
      shapeScale = Math.max(0.3, Math.min(1, (S * 0.45) / 2.3 / meanRadius));
      for (let i = 0; i < balls.length; i++) {
        let x = 0,
          y = 0,
          tries = 0;
        do {
          x = (Math.random() * 2 - 1) * 1.25;
          y = Math.random() * 2.55 - 1.4; // bbox y ∈ [-1.4, 1.15]
          tries++;
        } while (!inHeart(x, y) && tries < 60);
        balls[i].shapeTarget.set(x * S, (y + 0.12) * S + baseCY, (Math.random() - 0.5) * 0.35);
      }
    };
    assignHeartTargets();

    const scatterFar = (withInwardVelocity: boolean) => {
      const R = Math.max(viewportWidth, viewportHeight) * 1.5;
      for (const b of balls) {
        const a = Math.random() * Math.PI * 2;
        const px = Math.cos(a) * R * 1.25;
        const py = Math.sin(a) * R * 0.85;
        const pz = (Math.random() - 0.5) * 4;
        b.position.set(px, py, pz);
        b.meshGroup.position.copy(b.position);
        if (withInwardVelocity) {
          b.velocity
            .set(-px, -py, -pz)
            .normalize()
            .multiplyScalar(0.08 + Math.random() * 0.05);
        } else {
          b.velocity.set(0, 0, 0);
        }
      }
    };
    scatterFar(false); // parked off-screen until the loader reveals

    const params = {
      gravity: 0,
      rebound: -0.3,
      mouseRepelForce: 0.05,
      mouseRepelRadius: 4.4,
      damping: 0.91,
      centerAttractForce: 0.0035,
      bounciness: 0.02,
    };

    const mouseProjVec = new THREE.Vector3();
    const mouseWorld3D = new THREE.Vector3();
    const updateMouse3D = () => {
      const mousePos = mouseRef.current;
      if (!mousePos) return;
      mouseProjVec.set(mousePos.x, mousePos.y, 0.5);
      mouseProjVec.unproject(camera);
      const dir = mouseProjVec.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      mouseWorld3D.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    let animationFrameId = 0;
    const clock = new THREE.Clock();
    let localStarted = false;
    let entranceStart = 0;
    let reportedReady = false;

    const diffVec = new THREE.Vector3();
    const collideDiff = new THREE.Vector3();
    const relVel = new THREE.Vector3();
    const deltaPos = new THREE.Vector3();
    const rotAxis = new THREE.Vector3();
    const prevMouseWorld = new THREE.Vector3();
    let mouseSpeed = 0;

    const simulateAndRender = () => {
      animationFrameId = requestAnimationFrame(simulateAndRender);

      const time = clock.getElapsedTime();
      clock.getDelta();
      updateMouse3D();

      const ctrl = controlRef.current;
      const mousePos = mouseRef.current;

      if (ctrl?.started && !localStarted) {
        localStarted = true;
        entranceStart = time;
        scatterFar(true);
      }

      if (!localStarted) {
        renderer.render(scene, camera);
        if (!reportedReady) {
          reportedReady = true;
          onReadyRef.current();
        }
        return;
      }

      const progress = ctrl?.progress ?? 0;

      // --- mode blend factors ---
      const heroF = 1 - smoothstep(0.3, 0.8, progress);
      const dropRaw = smoothstep(0.4, 0.95, progress);
      const flyF = smoothstep(2.7, 3.45, progress);
      const shapeF = smoothstep(1.4, 2.05, progress) * (1 - smoothstep(2.55, 3.0, progress));
      const dropF = dropRaw * (1 - smoothstep(1.25, 1.75, progress));

      // --- scroll-driven palette morph: hero → volt-lime → rose-pink ---
      const bLime = smoothstep(0.55, 1.05, progress);
      const bPink = smoothstep(1.4, 1.95, progress);
      for (const role of ROLES) {
        curPal[role].copy(palHero[role]).lerp(palLime[role], bLime).lerp(palPink[role], bPink);
      }
      hemiLight.groundColor.copy(curPal.medium);

      const entranceT = easeOutCubic(clamp01((time - entranceStart) / 2.2));
      const attractionBoost = lerp(7.5, 1, entranceT);

      const isMouseInteracting =
        !!mousePos && (Math.abs(mousePos.x) < 0.99 || Math.abs(mousePos.y) < 0.99);

      mouseSpeed = isMouseInteracting ? mouseWorld3D.distanceTo(prevMouseWorld) : 0;
      if (mouseSpeed > 3) mouseSpeed = 3;
      prevMouseWorld.copy(mouseWorld3D);

      let damping = 0.91;
      damping = lerp(damping, 0.992, dropF);
      damping = lerp(damping, 0.9, shapeF);
      damping = lerp(damping, 0.985, flyF);

      const camZ = camera.position.z;
      const clusterActive = Math.max(heroF, entranceT < 1 ? 1 : 0);

      // 1. ACCELERATIONS
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        if (heroF > 0.01) {
          b.velocity.x += Math.sin(time * 0.4 + b.id * 1.5) * 0.0004 * b.radius * heroF;
          b.velocity.y += Math.cos(time * 0.5 + b.id * 1.2) * 0.0004 * b.radius * heroF;
          b.velocity.z += Math.sin(time * 0.35 + b.id) * 0.0001 * heroF;
        }

        const clusterStrength = params.centerAttractForce * attractionBoost * clusterActive;
        if (clusterStrength > 0.00001) {
          b.velocity.x += (0 - b.position.x) * clusterStrength * 0.38;
          b.velocity.y += (0 - b.position.y) * clusterStrength * 1.85;
          b.velocity.z += (0 - b.position.z) * clusterStrength * 1.8;
        }

        if (dropF > 0.001) {
          b.velocity.y -= 0.011 * dropF;
        }

        if (shapeF > 0.001) {
          const k = 0.06 * shapeF;
          b.velocity.x += (b.shapeTarget.x - b.position.x) * k;
          b.velocity.y += (b.shapeTarget.y - b.position.y) * k;
          b.velocity.z += (b.shapeTarget.z - b.position.z) * k;
        }

        if (flyF > 0.001) {
          const stagger = (b.id * 0.6180339887) % 1;
          const local = smoothstep(stagger * 0.55, stagger * 0.55 + 0.45, flyF);
          b.velocity.z += 0.05 * local;
          b.velocity.x += b.position.x * 0.006 * local;
          b.velocity.y += b.position.y * 0.006 * local;
        }

        if (mousePos && isMouseInteracting) {
          diffVec.subVectors(b.position, mouseWorld3D);
          const rawDist = diffVec.length();
          const down = mousePos.isDown;
          const activeRepelRadius = down ? params.mouseRepelRadius * 1.4 : params.mouseRepelRadius;
          const activeRepelForce = down ? params.mouseRepelForce * 1.7 : params.mouseRepelForce;
          if (rawDist < activeRepelRadius && rawDist > 0.0001) {
            const ratio = rawDist / activeRepelRadius;
            const smoothFactor = 1.0 - ratio * ratio * (3.0 - 2.0 * ratio);
            const speedBoost = 1 + mouseSpeed * 3.2;
            const push = smoothFactor * activeRepelForce * speedBoost;
            diffVec.normalize();
            diffVec.z *= 0.12;
            diffVec.normalize();
            b.velocity.addScaledVector(diffVec, push);
          }
        }

        b.velocity.multiplyScalar(damping);
        b.position.addScaledVector(b.velocity, 1);

        const c = b.isGlass ? curPal.glass : curPal[b.role];
        b.material.color.copy(c);
        if (!isBlack) b.material.emissive.copy(c);

        b.material.opacity =
          flyF > 0.001 ? 1 - smoothstep(camZ - 2.6, camZ - 0.3, b.position.z) : 1;

        const targetVis = b.radius * (1 - (1 - shapeScale) * shapeF);
        b.visualScale += (targetVis - b.visualScale) * 0.12;
        b.sphere.scale.setScalar(b.visualScale);
      }

      // 2. PAIRWISE COLLISIONS (nearly disabled in shape mode so balls snap onto the silhouette)
      const collideScale = 0.28 * (1 - 0.93 * shapeF) * (1 - flyF);
      const subSteps = 4;
      for (let step = 0; step < subSteps; step++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            collideDiff.subVectors(b2.position, b1.position);
            const dist = collideDiff.length();
            const minDist = b1.visualScale + b2.visualScale;
            if (dist < minDist && dist > 0.001) {
              const overlap = minDist - dist;
              collideDiff.multiplyScalar(1 / dist);
              const totalMass = b1.mass + b2.mass;
              const ratio1 = b2.mass / totalMass;
              const ratio2 = b1.mass / totalMass;
              b1.position.addScaledVector(collideDiff, -overlap * ratio1 * collideScale);
              b2.position.addScaledVector(collideDiff, overlap * ratio2 * collideScale);

              relVel.subVectors(b2.velocity, b1.velocity);
              const velAlongNormal = relVel.dot(collideDiff);
              if (velAlongNormal < -0.0001) {
                const impulse =
                  (-(1 + params.bounciness) * velAlongNormal) / (1 / b1.mass + 1 / b2.mass);
                b1.velocity.addScaledVector(collideDiff, -impulse / b1.mass);
                b2.velocity.addScaledVector(collideDiff, impulse / b2.mass);
              }
            }
          }
        }
      }

      // 3. VIEWPORT WALLS + BOUNCY FLOOR
      const borderPad = 0.2;
      const xBound = viewportWidth / 2 - borderPad;
      const topY = viewportHeight / 2 - 0.05;
      const floorY = -viewportHeight / 2 + 0.05;
      const zBound = 2.0;
      const restitution = 0.3 + 0.35 * dropF;

      const contain = flyF < 0.5;
      const zContain = flyF < 0.02;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const r = b.visualScale;

        if (contain) {
          if (b.position.x < -xBound - r) {
            b.position.x = -xBound - r;
            b.velocity.x *= params.rebound;
          } else if (b.position.x > xBound + r) {
            b.position.x = xBound + r;
            b.velocity.x *= params.rebound;
          }

          if (b.position.y - r < floorY) {
            b.position.y = floorY + r;
            if (b.velocity.y < 0) b.velocity.y = -b.velocity.y * restitution;
            if (dropF > 0.3) {
              b.velocity.x *= 0.86;
              b.velocity.z *= 0.86;
            }
          }
          if (b.position.y + r > topY) {
            b.position.y = topY - r;
            if (b.velocity.y > 0) b.velocity.y *= params.rebound;
          }
        }

        if (zContain) {
          if (b.position.z < -zBound) {
            b.position.z = -zBound;
            b.velocity.z *= params.rebound;
          } else if (b.position.z > zBound) {
            b.position.z = zBound;
            b.velocity.z *= params.rebound;
          }
        }

        deltaPos.copy(b.position).sub(b.meshGroup.position);
        if (deltaPos.lengthSq() > 0.000001) {
          rotAxis.set(deltaPos.y, -deltaPos.x, 0).normalize();
          const rotAngle = (deltaPos.length() / b.radius) * 0.95;
          b.meshGroup.rotateOnWorldAxis(rotAxis, rotAngle);
        }
        b.meshGroup.position.copy(b.position);
      }

      renderer.render(scene, camera);
      if (!reportedReady) {
        reportedReady = true;
        onReadyRef.current();
      }
    };

    simulateAndRender();

    let lastResizeW = container.clientWidth;
    let lastResizeH = container.clientHeight;
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      updateFrustumBounds();
      // Mobile URL-bar show/hide fires small height-only resizes on every
      // scroll — skip the heart-target reshuffle for those so the formation
      // doesn't scramble mid-scroll; real resizes still reassign.
      if (Math.abs(width - lastResizeW) > 2 || Math.abs(height - lastResizeH) > 150) {
        assignHeartTargets();
        lastResizeW = width;
        lastResizeH = height;
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      for (const b of balls) {
        b.material.dispose();
      }
      sphereGeometry.dispose();
      renderer.dispose();
      // Actively release the GL context — palette switches rebuild the scene,
      // and browsers cap the number of live WebGL contexts per page.
      renderer.forceContextLoss();
      container.removeChild(canvas);
    };
  }, [ballColor, controlRef, mouseRef]);

  return <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0" />;
}

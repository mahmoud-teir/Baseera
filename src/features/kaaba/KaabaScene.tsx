/* eslint-disable react-hooks/immutability, react-hooks/refs, react/no-unknown-property -- imperative three.js
   camera rig driven by refs (opted out of the React Compiler below); JSX props are react-three-fiber intrinsics. */
/**
 * Kaaba 3D Stage — Precision realistic interactive architectural viewer of the Holy Kaaba.
 * Supports:
 * - Dynamic focal landmark tracking (Black Stone, Door, Mizab, Hijr Ismail, Maqam Ibrahim)
 * - Deep zooming in/out (from close-up inspection to full Mataf overview)
 * - Smooth inertia drag-to-orbit and pinch gestures
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as THREE from 'three';

import { buildKaaba, frameFor, KAABA_LANDMARKS } from '@/three/kaaba';

interface Orbit {
  az: number;
  polar: number;
  dist: number;
  tAz: number;
  tPolar: number;
  tDist: number;
  auto: boolean;
}

function Rig({
  orbit,
  targetCenter,
  minDist,
  maxDist,
  reduceMotion,
}: {
  orbit: React.MutableRefObject<Orbit>;
  targetCenter: React.MutableRefObject<THREE.Vector3>;
  minDist: number;
  maxDist: number;
  reduceMotion: boolean;
}) {
  'use no memo';
  const { camera, invalidate } = useThree();
  const currentCenter = useRef(new THREE.Vector3(0, 5, 0));

  useFrame((_, dt) => {
    const o = orbit.current;
    if (o.auto && !reduceMotion) o.tAz += ((2 * Math.PI) / 60) * 0.9 * dt;
    o.tPolar = Math.min(Math.PI / 2 - 0.05, Math.max(0.12, o.tPolar));
    o.tDist = Math.min(maxDist, Math.max(minDist, o.tDist));

    const k = 1 - Math.pow(1 - 0.1, dt * 60);
    o.az += (o.tAz - o.az) * k;
    o.polar += (o.tPolar - o.polar) * k;
    o.dist += (o.tDist - o.dist) * k;

    currentCenter.current.lerp(targetCenter.current, k);

    const sp = Math.sin(o.polar);
    const c = currentCenter.current;
    camera.position.set(
      c.x + o.dist * sp * Math.sin(o.az),
      c.y + o.dist * Math.cos(o.polar),
      c.z + o.dist * sp * Math.cos(o.az)
    );
    camera.lookAt(c);
    invalidate();
  });
  return null;
}

function Scene({
  orbit,
  targetCenter,
  defaultDist,
  landmark,
  zoomStep,
  reduceMotion,
}: {
  orbit: React.MutableRefObject<Orbit>;
  targetCenter: React.MutableRefObject<THREE.Vector3>;
  defaultDist: React.MutableRefObject<number>;
  landmark?: string;
  zoomStep?: number;
  reduceMotion: boolean;
}) {
  'use no memo';
  const model = useMemo(() => buildKaaba(), []);
  const f = useMemo(() => frameFor(model), [model]);
  const { camera } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = Math.max(f.dist / 100, 0.01);
    cam.far = f.dist * 100;
    cam.updateProjectionMatrix();
    defaultDist.current = f.dist;
    orbit.current = {
      az: f.azimuth,
      polar: f.polar,
      dist: f.dist,
      tAz: f.azimuth,
      tPolar: f.polar,
      tDist: f.dist,
      auto: orbit.current.auto,
    };
    targetCenter.current.copy(f.center);
  }, [camera, f, orbit, targetCenter, defaultDist]);

  // Handle Landmark Selection Focus
  useEffect(() => {
    if (!landmark) return;
    const l = KAABA_LANDMARKS.find((x) => x.id === landmark);
    if (!l) return;
    orbit.current.auto = false;
    orbit.current.tAz = l.azimuth;
    orbit.current.tPolar = l.polar;
    orbit.current.tDist = Math.max(f.dist * 0.12, defaultDist.current * l.distFactor);
    targetCenter.current.set(l.centerOffset[0], l.centerOffset[1], l.centerOffset[2]);
  }, [landmark, f.dist, orbit, targetCenter, defaultDist]);

  // Handle Zoom In / Out Step Trigger
  const prevZoom = useRef(zoomStep ?? 0);
  useEffect(() => {
    if (zoomStep == null) return;
    const delta = zoomStep - prevZoom.current;
    prevZoom.current = zoomStep;
    if (delta === 0) return;
    orbit.current.auto = false;
    if (delta > 0) {
      orbit.current.tDist = Math.max(f.dist * 0.1, orbit.current.tDist * Math.pow(0.8, Math.min(delta, 3))); // Zoom In
    } else {
      orbit.current.tDist = Math.min(f.dist * 3.2, orbit.current.tDist * Math.pow(1.25, Math.min(-delta, 3))); // Zoom Out
    }
  }, [zoomStep, f.dist, orbit]);

  const span = f.radius * 3.5;
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xd0c8b6, 1.15]} />
      <directionalLight
        position={[6, 9, 7]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[Platform.OS === 'web' ? 2048 : 1024, Platform.OS === 'web' ? 2048 : 1024]}
        shadow-bias={-0.0002}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
      <directionalLight position={[-7, 5, -6]} intensity={0.7} color={0xffedd5} />
      <directionalLight position={[0, -2, 0]} intensity={0.25} color={0xffffff} />
      <mesh rotation-x={-Math.PI / 2} position-y={f.groundY} receiveShadow>
        <planeGeometry args={[250, 250]} />
        <shadowMaterial opacity={0.22} />
      </mesh>
      <primitive object={model} />
      <Rig
        orbit={orbit}
        targetCenter={targetCenter}
        minDist={f.dist * 0.1}
        maxDist={f.dist * 3.2}
        reduceMotion={reduceMotion}
      />
    </>
  );
}

export default function KaabaScene({
  background = '#0E2A25',
  landmark,
  zoomStep,
  reduceMotion = false,
}: {
  background?: string;
  landmark?: string;
  zoomStep?: number;
  reduceMotion?: boolean;
}) {
  'use no memo';
  const orbit = useRef<Orbit>({ az: 0.8, polar: 1.15, dist: 50, tAz: 0.8, tPolar: 1.15, tDist: 50, auto: true });
  const targetCenter = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 0));
  const defaultDist = useRef(50);
  const pinchStart = useRef(50);
  const host = useRef<ComponentRef<typeof View>>(null);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      orbit.current.auto = false;
    })
    .onChange((e) => {
      orbit.current.tAz -= e.changeX * 0.008;
      orbit.current.tPolar -= e.changeY * 0.008;
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      orbit.current.auto = false;
      pinchStart.current = orbit.current.tDist;
    })
    .onUpdate((e) => {
      orbit.current.tDist = pinchStart.current / Math.max(0.15, e.scale);
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbit.current.auto = false;
      orbit.current.tDist *= 1 + Math.sign(e.deltaY) * 0.1;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <View ref={host} style={{ flex: 1, backgroundColor: background }} collapsable={false}>
        <Canvas
          shadows
          dpr={Platform.OS === 'web' ? [1, 2] : 1}
          camera={{ fov: 45, near: 0.01, far: 500, position: [3, 2.2, 4] }}
          gl={{ antialias: true, alpha: true }}
          style={{ flex: 1 }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color(background), 1);
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}>
          <Scene
            orbit={orbit}
            targetCenter={targetCenter}
            defaultDist={defaultDist}
            landmark={landmark}
            zoomStep={zoomStep}
            reduceMotion={reduceMotion}
          />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

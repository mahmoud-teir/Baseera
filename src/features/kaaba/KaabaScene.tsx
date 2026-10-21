/* eslint-disable react-hooks/immutability, react-hooks/refs, react/no-unknown-property -- imperative three.js
   camera rig driven by refs (opted out of the React Compiler below); JSX props are react-three-fiber intrinsics. */
/**
 * Kaaba 3D stage — the `three-d-stage` behaviour rebuilt with react-three-fiber (web: WebGL,
 * native: expo-gl): hemisphere + key (shadow) + fill lights, 18% shadow ground, auto-rotate
 * (speed 1.2) until the first interaction, drag to orbit with damping 0.08, pinch / wheel to zoom.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as THREE from 'three';

import { buildKaaba, frameFor } from '@/three/kaaba';

interface Orbit {
  az: number;
  polar: number;
  dist: number;
  tAz: number;
  tPolar: number;
  tDist: number;
  auto: boolean;
}

function Rig({ orbit, center, minDist, maxDist, reduceMotion }: { orbit: React.MutableRefObject<Orbit>; center: THREE.Vector3; minDist: number; maxDist: number; reduceMotion: boolean }) {
  'use no memo';
  const { camera, invalidate } = useThree();
  useFrame((_, dt) => {
    const o = orbit.current;
    if (o.auto && !reduceMotion) o.tAz += ((2 * Math.PI) / 60) * 1.2 * dt; // OrbitControls autoRotateSpeed 1.2
    o.tPolar = Math.min(Math.PI / 2 - 0.05, Math.max(0.15, o.tPolar));
    o.tDist = Math.min(maxDist, Math.max(minDist, o.tDist));
    const k = 1 - Math.pow(1 - 0.08, dt * 60);
    o.az += (o.tAz - o.az) * k;
    o.polar += (o.tPolar - o.polar) * k;
    o.dist += (o.tDist - o.dist) * k;
    const sp = Math.sin(o.polar);
    camera.position.set(center.x + o.dist * sp * Math.sin(o.az), center.y + o.dist * Math.cos(o.polar), center.z + o.dist * sp * Math.cos(o.az));
    camera.lookAt(center);
    invalidate();
  });
  return null;
}

function Scene({ orbit, reduceMotion }: { orbit: React.MutableRefObject<Orbit>; reduceMotion: boolean }) {
  'use no memo';
  const model = useMemo(() => buildKaaba(), []);
  const f = useMemo(() => frameFor(model), [model]);
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = Math.max(f.dist / 100, 0.01);
    cam.far = f.dist * 100;
    cam.updateProjectionMatrix();
    orbit.current = { az: f.azimuth, polar: f.polar, dist: f.dist, tAz: f.azimuth, tPolar: f.polar, tDist: f.dist, auto: orbit.current.auto };
  }, [camera, f, orbit]);
  const span = f.radius * 3;
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xd8d2c4, 1.0]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[Platform.OS === 'web' ? 2048 : 1024, Platform.OS === 'web' ? 2048 : 1024]}
        shadow-bias={-0.0002}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} color={0xfff4e6} />
      <mesh rotation-x={-Math.PI / 2} position-y={f.groundY} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <primitive object={model} />
      <Rig orbit={orbit} center={f.center} minDist={f.dist * 0.3} maxDist={f.dist * 2} reduceMotion={reduceMotion} />
    </>
  );
}

export default function KaabaScene({ background = '#0E2A25', reduceMotion = false }: { background?: string; reduceMotion?: boolean }) {
  'use no memo';
  const orbit = useRef<Orbit>({ az: 0, polar: 1, dist: 80, tAz: 0, tPolar: 1, tDist: 80, auto: true });
  const pinchStart = useRef(1);
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
      orbit.current.tDist = pinchStart.current / Math.max(0.2, e.scale);
    });
  const gesture = Gesture.Simultaneous(pan, pinch);

  // Mouse wheel zoom on the web.
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
          <Scene orbit={orbit} reduceMotion={reduceMotion} />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

/**
 * Kaaba model — exact port of `Kaaba 3D.html` (meshes, metre dimensions W12 × D11 × H13,
 * materials and Hijr Ismail). Shared by the web and native renderers.
 */
import * as THREE from 'three';

export function buildKaaba(): THREE.Group {
  const M = (n: string, c: number, r = 0.8, m = 0.05) => {
    const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    x.name = n;
    return x;
  };
  const black = M('kiswa_black', 0x15110f, 0.9);
  const gold = M('gold_embroidery', 0xc4a66a, 0.45, 0.3);
  const stone = M('marble_white', 0xe9e4d6, 0.7);
  const floor = M('mataf_stone', 0xcfc6b0, 0.9);
  const silver = M('silver_frame', 0xbfc3c4, 0.4, 0.3);
  const door = M('door_gold', 0xb8923f, 0.4, 0.35);

  const g = new THREE.Group();
  g.name = 'kaaba_model';
  const add = (n: string, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = n;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  const W = 12;
  const D = 11;
  const H = 13;
  add('kaaba_body', new THREE.BoxGeometry(W, H, D), black, 0, H / 2, 0);

  // Hizam — gold band on the upper third.
  const bandY = H * 0.72;
  const bh = 1.15;
  add('hizam_front', new THREE.BoxGeometry(W + 0.04, bh, 0.04), gold, 0, bandY, D / 2 + 0.021);
  add('hizam_back', new THREE.BoxGeometry(W + 0.04, bh, 0.04), gold, 0, bandY, -D / 2 - 0.021);
  add('hizam_left', new THREE.BoxGeometry(0.04, bh, D + 0.04), gold, -W / 2 - 0.021, bandY, 0);
  add('hizam_right', new THREE.BoxGeometry(0.04, bh, D + 0.04), gold, W / 2 + 0.021, bandY, 0);

  // Abstract calligraphy panels, three per side.
  const sides: [string, number, number, number][] = [
    ['front', 0, D / 2 + 0.03, 0],
    ['back', 0, -D / 2 - 0.03, Math.PI],
    ['left', -W / 2 - 0.03, 0, -Math.PI / 2],
    ['right', W / 2 + 0.03, 0, Math.PI / 2],
  ];
  for (const [side, sx, sz, ry] of sides) {
    const len = side === 'front' || side === 'back' ? W : D;
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(len * 0.2, 0.45, 0.02), gold);
      p.name = `panel_${side}_${i}`;
      p.position.set(sx, bandY, sz);
      p.rotation.y = ry;
      const off = (i - 1) * len * 0.27;
      if (side === 'front' || side === 'back') p.position.x = off * (side === 'back' ? -1 : 1);
      else p.position.z = off * (side === 'left' ? -1 : 1);
      g.add(p);
    }
  }

  // Door on the north-east wall, raised ~2.1 m.
  const dh = 3.1;
  const dw = 1.7;
  add('door_frame', new THREE.BoxGeometry(0.12, dh + 0.3, dw + 0.3), gold, W / 2 + 0.07, 2.1 + dh / 2, -1.5);
  add('door', new THREE.BoxGeometry(0.1, dh, dw), door, W / 2 + 0.12, 2.1 + dh / 2, -1.5);

  // Black Stone corner with its silver frame.
  add('hajar_frame', new THREE.TorusGeometry(0.35, 0.07, 16, 40), silver, W / 2 + 0.05, 1.5, D / 2 + 0.05).rotation.y = Math.PI / 4;
  add('black_stone', new THREE.SphereGeometry(0.28, 24, 16), M('hajar_stone', 0x2a2420, 0.6, 0.1), W / 2 + 0.05, 1.5, D / 2 + 0.05);

  // Shadharwan base and the mataf floor.
  add('shadharwan', new THREE.BoxGeometry(W + 0.9, 0.45, D + 0.9), stone, 0, 0.225, 0);
  add('mataf', new THREE.CylinderGeometry(26, 26, 0.2, 96), floor, 0, -0.1, 0);

  // Hijr Ismail — low semicircular wall to the north-west.
  const hijr = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.4, 48, 1, true, Math.PI / 2, Math.PI), stone);
  hijr.name = 'hijr_ismail_wall';
  stone.side = THREE.DoubleSide;
  hijr.position.set(0, 0.7, -D / 2 - 3.6);
  hijr.rotation.y = Math.PI / 2;
  g.add(hijr);
  add('hijr_floor', new THREE.CylinderGeometry(4.1, 4.1, 0.15, 48, 1, false, Math.PI / 2, Math.PI), stone, 0, 0.08, -D / 2 - 3.6).rotation.y = Math.PI / 2;

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/** Framing from three-d-stage.js `setObject`: direction (1, .55, 1.25), distance r/tan(fov/2)×1.35. */
export function frameFor(object: THREE.Object3D, fov = 45) {
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dist = (sphere.radius / Math.tan((fov * Math.PI) / 360)) * 1.35;
  const dir = new THREE.Vector3(1, 0.55, 1.25).normalize();
  const azimuth = Math.atan2(dir.x, dir.z);
  const polar = Math.acos(dir.y);
  return { center: sphere.center.clone(), radius: sphere.radius, dist, azimuth, polar, groundY: box.min.y };
}

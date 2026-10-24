/**
 * Kaaba model — Realistic detailed 3D architectural reconstruction of the Holy Kaaba in Mecca
 * Dimensions: W 12m × D 11m × H 13.1m
 * Features:
 * - Holy Kaaba body with rich Kiswa texture & corners
 * - Golden embroidered Hizam (belt) and lower calligraphy medallions
 * - Golden Door of the Kaaba with Burqa curtain relief
 * - Al-Multazam sacred area
 * - The Black Stone (الحجر الأسود) with oval silver casing
 * - Mizab Al-Rahmah (ميزاب الرحمة) golden rainwater spout pointing to Hijr Ismail
 * - Hijr Ismail (حجر إسماعيل) semicircular marble wall with three lanterns
 * - Al-Rukn Al-Yamani (الركن اليماني) corner
 * - Al-Shadharwan (الشاذروان) marble plinth with brass anchor rings
 * - Maqam Ibrahim (مقام إبراهيم) golden pavilion
 * - Mataf courtyard with concentric marble rings
 */
import * as THREE from 'three';

export function buildKaaba(): THREE.Group {
  const M = (n: string, c: number, r = 0.8, m = 0.05) => {
    const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    x.name = n;
    return x;
  };

  const blackKiswa = M('kiswa_black', 0x110f0e, 0.95, 0.02);
  const gold = M('gold_embroidery', 0xd4af37, 0.35, 0.55);
  const brightGold = M('door_gold', 0xf59e0b, 0.3, 0.65);
  const marbleWhite = M('marble_white', 0xf8f9fa, 0.55, 0.05);
  const marbleShadharwan = M('marble_shadharwan', 0xedebe4, 0.65, 0.05);
  const matafFloor = M('mataf_floor', 0xe2ded4, 0.85, 0.02);
  const matafRing = M('mataf_ring', 0xd5cfc1, 0.9, 0.02);
  const silver = M('silver_frame', 0xd1d5db, 0.25, 0.7);
  const blackStoneMat = M('hajar_stone', 0x1f1917, 0.5, 0.1);
  const brassRing = M('brass_ring', 0xb45309, 0.3, 0.8);
  const yamaniStone = M('yamani_stone', 0x4a433d, 0.85, 0.05);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
  });

  const g = new THREE.Group();
  g.name = 'kaaba_model';

  const add = (n: string, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = n;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  // Dimensions of the Holy Kaaba (meters)
  const W = 12.0;
  const D = 11.0;
  const H = 13.1;

  // 1. Holy Kaaba Core Body
  add('kaaba_body', new THREE.BoxGeometry(W, H, D), blackKiswa, 0, H / 2, 0);

  // 2. Upper Golden Belt (الحزام) — Runs around all 4 walls at ~0.72 of height
  const bandY = H * 0.73;
  const bh = 1.05;
  add('hizam_front', new THREE.BoxGeometry(W + 0.05, bh, 0.05), gold, 0, bandY, D / 2 + 0.025);
  add('hizam_back', new THREE.BoxGeometry(W + 0.05, bh, 0.05), gold, 0, bandY, -D / 2 - 0.025);
  add('hizam_left', new THREE.BoxGeometry(0.05, bh, D + 0.05), gold, -W / 2 - 0.025, bandY, 0);
  add('hizam_right', new THREE.BoxGeometry(0.05, bh, D + 0.05), gold, W / 2 + 0.025, bandY, 0);

  // Calligraphy Medallions & Panels (قناديل وسور الكسوة)
  const sides: [string, number, number, number][] = [
    ['front', 0, D / 2 + 0.04, 0],
    ['back', 0, -D / 2 - 0.04, Math.PI],
    ['left', -W / 2 - 0.04, 0, -Math.PI / 2],
    ['right', W / 2 + 0.04, 0, Math.PI / 2],
  ];

  for (const [side, sx, sz, ry] of sides) {
    const len = side === 'front' || side === 'back' ? W : D;
    // Upper hizam rectangular calligraphy plaques
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(len * 0.18, 0.48, 0.02), gold);
      p.name = `panel_${side}_${i}`;
      p.position.set(sx, bandY, sz);
      p.rotation.y = ry;
      const off = (i - 1.5) * len * 0.23;
      if (side === 'front' || side === 'back') p.position.x = off * (side === 'back' ? -1 : 1);
      else p.position.z = off * (side === 'left' ? -1 : 1);
      g.add(p);
    }
    // Lower decorative medallions (قناديل الكسوة)
    for (let i = 0; i < 3; i++) {
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 16), gold);
      med.name = `medallion_${side}_${i}`;
      med.position.set(sx, bandY - 1.5, sz);
      med.rotation.x = Math.PI / 2;
      med.rotation.z = ry;
      const off = (i - 1) * len * 0.28;
      if (side === 'front' || side === 'back') med.position.x = off;
      else med.position.z = off;
      g.add(med);
    }
  }

  // 3. Bab Al-Kaaba (باب الكعبة المشرفة) — East Facade (x = W / 2)
  const dh = 3.18;
  const dw = 1.71;
  const doorY = 2.22 + dh / 2;
  const doorZ = -1.5;

  // Door casing frame
  add('door_frame', new THREE.BoxGeometry(0.14, dh + 0.4, dw + 0.4), brightGold, W / 2 + 0.08, doorY, doorZ);
  // Two golden door panels
  add('door_panel_left', new THREE.BoxGeometry(0.1, dh - 0.05, dw / 2 - 0.04), brightGold, W / 2 + 0.12, doorY, doorZ - dw / 4);
  add('door_panel_right', new THREE.BoxGeometry(0.1, dh - 0.05, dw / 2 - 0.04), brightGold, W / 2 + 0.12, doorY, doorZ + dw / 4);

  // Door Curtain Relief (البرقع / ستارة باب الكعبة)
  const burqa = new THREE.Mesh(new THREE.BoxGeometry(0.06, dh + 0.8, dw + 0.2), gold);
  burqa.name = 'door_burqa';
  burqa.position.set(W / 2 + 0.06, doorY + 0.2, doorZ);
  g.add(burqa);

  // 4. Al-Multazam (الملتزم) — The sacred wall between Door and Black Stone
  add('multazam_marker', new THREE.BoxGeometry(0.03, 3.2, 1.8), marbleWhite, W / 2 + 0.02, 2.5, 0.4);

  // 5. The Black Stone (الحجر الأسود) — South-East Corner
  const hajarX = W / 2 + 0.06;
  const hajarY = 1.5;
  const hajarZ = D / 2 + 0.06;

  // Pure Silver Ovular Casing
  const silverFrame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 24, 48), silver);
  silverFrame.name = 'hajar_frame';
  silverFrame.position.set(hajarX, hajarY, hajarZ);
  silverFrame.rotation.y = Math.PI / 4;
  silverFrame.rotation.x = Math.PI / 8;
  g.add(silverFrame);

  // Sacred Black Stone in the center
  add('black_stone_core', new THREE.SphereGeometry(0.26, 32, 24), blackStoneMat, hajarX, hajarY, hajarZ);

  // 6. Al-Rukn Al-Yamani (الركن اليماني) — South-West Corner (x = -W / 2, z = D / 2)
  add('yamani_band', new THREE.BoxGeometry(0.8, 0.35, 0.8), silver, -W / 2 - 0.02, 1.4, D / 2 + 0.02);
  add('yamani_stone', new THREE.BoxGeometry(0.7, 1.8, 0.7), yamaniStone, -W / 2, 1.4, D / 2);

  // 7. Mizab Al-Rahmah (ميزاب الرحمة الذهبي) — North-West Wall Roof (points to Hijr Ismail)
  const mizabGroup = new THREE.Group();
  mizabGroup.name = 'mizab_al_rahmah';
  // Golden trough
  const trough = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 1.95), brightGold);
  trough.position.set(0, H + 0.1, -D / 2 - 0.85);
  mizabGroup.add(trough);
  // Sloping spout lip
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 16), brightGold);
  spout.position.set(0, H - 0.05, -D / 2 - 1.8);
  spout.rotation.x = Math.PI / 3;
  mizabGroup.add(spout);
  // Ornamental crest at back of mizab
  const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), brightGold);
  crest.position.set(0, H + 0.3, -D / 2 - 0.2);
  mizabGroup.add(crest);
  g.add(mizabGroup);

  // 8. Al-Shadharwan Base (الشاذروان الرخامي المطاف)
  add('shadharwan_base', new THREE.BoxGeometry(W + 0.95, 0.48, D + 0.95), marbleShadharwan, 0, 0.24, 0);

  // Brass Anchor Rings (حلقات الشاذروان لتثبيت الكسوة)
  for (let i = -4; i <= 4; i++) {
    // Front and Back rings
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), brassRing);
    r1.position.set(i * 1.25, 0.28, D / 2 + 0.48);
    g.add(r1);

    const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), brassRing);
    r2.position.set(i * 1.25, 0.28, -D / 2 - 0.48);
    g.add(r2);
  }

  // 9. Hijr Ismail / Al-Hateem (حجر إسماعيل)
  const hijrRadius = 4.3;
  const hijrWall = new THREE.Mesh(
    new THREE.CylinderGeometry(hijrRadius, hijrRadius, 1.35, 64, 1, true, Math.PI / 2, Math.PI),
    marbleWhite
  );
  hijrWall.name = 'hijr_ismail_wall';
  marbleWhite.side = THREE.DoubleSide;
  hijrWall.position.set(0, 0.675, -D / 2 - 3.7);
  hijrWall.rotation.y = Math.PI / 2;
  g.add(hijrWall);

  // Hijr White Marble Floor
  add('hijr_floor', new THREE.CylinderGeometry(hijrRadius - 0.1, hijrRadius - 0.1, 0.18, 64, 1, false, Math.PI / 2, Math.PI), marbleWhite, 0, 0.09, -D / 2 - 3.7).rotation.y = Math.PI / 2;

  // Three Golden Lanterns on Hijr Wall
  const lanternAngles = [Math.PI * 0.65, Math.PI * 1.0, Math.PI * 1.35];
  lanternAngles.forEach((ang, idx) => {
    const lx = (hijrRadius) * Math.cos(ang);
    const lz = -D / 2 - 3.7 + (hijrRadius) * Math.sin(ang);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.5, 12), brightGold);
    lantern.name = `hijr_lantern_${idx}`;
    lantern.position.set(lx, 1.6, lz);
    g.add(lantern);
  });

  // 10. Maqam Ibrahim (مقام إبراهيم عليه السلام) — Pavilion opposite Kaaba Door
  const maqamGroup = new THREE.Group();
  maqamGroup.name = 'maqam_ibrahim';
  const maqamX = W / 2 + 5.2;
  const maqamZ = -1.5;

  // Hexagonal Marble Base
  const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.4, 6), marbleWhite);
  mBase.position.set(maqamX, 0.2, maqamZ);
  maqamGroup.add(mBase);

  // Golden Lattice Pavilion Columns
  const mPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.6, 6, 1, true), brightGold);
  mPillar.position.set(maqamX, 1.2, maqamZ);
  maqamGroup.add(mPillar);

  // Glass/Crystal Enclosure inside
  const mGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.5, 16), glassMat);
  mGlass.position.set(maqamX, 1.2, maqamZ);
  maqamGroup.add(mGlass);

  // Golden Dome Cap
  const mDome = new THREE.Mesh(new THREE.SphereGeometry(0.76, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), brightGold);
  mDome.position.set(maqamX, 2.0, maqamZ);
  maqamGroup.add(mDome);

  // Crescent finial
  const mFinial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), brightGold);
  mFinial.position.set(maqamX, 2.85, maqamZ);
  maqamGroup.add(mFinial);

  g.add(maqamGroup);

  // 11. Mataf Courtyard (المطاف الشريف) — Concentric White Marble Rings
  add('mataf_outer', new THREE.CylinderGeometry(34, 34, 0.25, 96), matafFloor, 0, -0.125, 0);
  add('mataf_ring1', new THREE.CylinderGeometry(24, 24, 0.26, 96), matafRing, 0, -0.12, 0);
  add('mataf_ring2', new THREE.CylinderGeometry(18, 18, 0.27, 96), marbleWhite, 0, -0.115, 0);
  add('mataf_inner', new THREE.CylinderGeometry(12, 12, 0.28, 96), marbleWhite, 0, -0.11, 0);

  // Shadow casting on all architectural meshes
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return g;
}

/** Framing presets and camera angles for each holy landmark */
export interface LandmarkPreset {
  id: string;
  name: string;
  icon: string;
  desc: string;
  azimuth: number;
  polar: number;
  distFactor: number;
  centerOffset: [number, number, number];
}

export const KAABA_LANDMARKS: LandmarkPreset[] = [
  {
    id: 'overview',
    name: 'نظرة شاملة',
    icon: '🕋',
    desc: 'الكعبة المشرفة وصحن المطاف وحجر إسماعيل ومقام إبراهيم.',
    azimuth: 0.8,
    polar: 1.15,
    distFactor: 1.0,
    centerOffset: [0, 5, 0],
  },
  {
    id: 'hajar',
    name: 'الحجر الأسود',
    icon: '🖤',
    desc: 'الركن الجنوبي الشرقي، الإطار الفضي المصمت، مبدأ الطواف ومنتهاه.',
    azimuth: 0.78,
    polar: 1.35,
    distFactor: 0.32,
    centerOffset: [6, 1.8, 5.5],
  },
  {
    id: 'door',
    name: 'باب الكعبة والملتزم',
    icon: '🚪',
    desc: 'الباب الذهبي الخالص، والملتزم بين الحجر والباب حيث يُستجاب الدعاء.',
    azimuth: 1.55,
    polar: 1.25,
    distFactor: 0.38,
    centerOffset: [6, 3.8, -1.5],
  },
  {
    id: 'mizab',
    name: 'ميزاب الرحمة',
    icon: '🌧️',
    desc: 'ميزاب الذهب الخالص أعلى الجدار الشمالي الغربي يصب في حجر إسماعيل.',
    azimuth: -1.55,
    polar: 0.72,
    distFactor: 0.4,
    centerOffset: [0, 11, -5.5],
  },
  {
    id: 'hijr',
    name: 'حجر إسماعيل (الحطيم)',
    icon: '🌙',
    desc: 'الجدار الرخامي المقوس، الصلاة داخله تعد صلاة داخل الكعبة المشرفة.',
    azimuth: -1.55,
    polar: 0.95,
    distFactor: 0.65,
    centerOffset: [0, 2, -8],
  },
  {
    id: 'maqam',
    name: 'مقام إبراهيم',
    icon: '🏛️',
    desc: 'المقصورة الذهبية التي تضم حجر أثر قدمي الخليل إبراهيم عليه السلام.',
    azimuth: 1.7,
    polar: 1.3,
    distFactor: 0.45,
    centerOffset: [10, 1.5, -1.5],
  },
  {
    id: 'yamani',
    name: 'الركن اليماني',
    icon: '🧭',
    desc: 'الركن الجنوبي الغربي، يُستلم باليمين دون تقبيل اقتداءً بسنة النبي ﷺ.',
    azimuth: -0.78,
    polar: 1.35,
    distFactor: 0.35,
    centerOffset: [-6, 1.8, 5.5],
  },
];

/** Framing from three-d-stage `setObject`: direction (1, .55, 1.25), distance r/tan(fov/2)×1.35. */
export function frameFor(object: THREE.Object3D, fov = 45) {
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dist = (sphere.radius / Math.tan((fov * Math.PI) / 360)) * 1.35;
  const dir = new THREE.Vector3(1, 0.55, 1.25).normalize();
  const azimuth = Math.atan2(dir.x, dir.z);
  const polar = Math.acos(dir.y);
  return { center: sphere.center.clone(), radius: sphere.radius, dist, azimuth, polar, groundY: box.min.y };
}

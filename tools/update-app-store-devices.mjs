import fs from 'node:fs';

const path = 'src/state/app-store.ts';
let s = fs.readFileSync(path, 'utf8');

// 1. Add DeviceEntry interface if not present
if (!s.includes('export interface DeviceEntry')) {
  const insertBefore = 'export interface CoachState';
  const deviceType = `export interface DeviceEntry {\r\n  id: string;\r\n  title: string;\r\n  os: string;\r\n  type: string;\r\n  lastActive: number;\r\n}\r\n\r\n`;
  s = s.replace(insertBefore, deviceType + insertBefore);
}

// 2. Add defaults to SETTINGS_DEFAULTS
if (!s.includes("quranRem: true,")) {
  s = s.replace("tafsir: 'تفسير السعدي',", "tafsir: 'تفسير السعدي',\r\n  quranRem: true,\r\n  muadhin: 'makkah',");
}

// 3. Add devices to AppState
if (!s.includes('devices: Record<string, DeviceEntry>;')) {
  s = s.replace('certificates: Certificate[];', 'certificates: Certificate[];\r\n  devices: Record<string, DeviceEntry>;');
}

// 4. Add recordDevice and removeDevice to Actions interface
if (!s.includes('recordDevice: (entry: DeviceEntry) => void;')) {
  s = s.replace('resetProgress: () => void;', 'resetProgress: () => void;\r\n  recordDevice: (entry: DeviceEntry) => void;\r\n  removeDevice: (id: string) => void;');
}

// 5. Add devices to INITIAL_STATE
if (!s.includes('devices: {},')) {
  s = s.replace('certificates: [],', 'certificates: [],\r\n  devices: {},');
}

// 6. Add recordDevice and removeDevice implementation
if (!s.includes('recordDevice: (entry) =>')) {
  const actionsImpl = `        recordDevice: (entry) =>\r\n          touch({ devices: { ...get().devices, [entry.id]: entry } }),\r\n        removeDevice: (id) => {\r\n          const copy = { ...get().devices };\r\n          delete copy[id];\r\n          touch({ devices: copy });\r\n        },\r\n`;
  s = s.replace('resetProgress: () =>', actionsImpl + '        resetProgress: () =>');
}

fs.writeFileSync(path, s);
console.log('app-store.ts updated with devices and notification settings successfully!');

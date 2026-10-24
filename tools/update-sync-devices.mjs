import fs from 'node:fs';

const path = 'src/services/sync.ts';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("'devices',")) {
  s = s.replace("'certificates',", "'certificates',\r\n  'devices',");
}

if (!s.includes('base.devices = devices;')) {
  const mergeTarget = 'base.notes = [...local.notes, ...remote.notes.filter((n) => !ids.has(n.id))].sort((a, b) => b.at - a.at);';
  const deviceMerge = `\r\n  // Devices: union by device id, keeping the newer lastActive\r\n  const devices = { ...(remote.devices ?? {}) };\r\n  for (const [id, dev] of Object.entries(local.devices ?? {})) {\r\n    if (!devices[id] || dev.lastActive > devices[id].lastActive) {\r\n      devices[id] = dev;\r\n    }\r\n  }\r\n  base.devices = devices;`;
  s = s.replace(mergeTarget, mergeTarget + deviceMerge);
}

fs.writeFileSync(path, s);
console.log('sync.ts updated with devices successfully!');

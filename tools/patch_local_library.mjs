import { readFileSync, writeFileSync } from 'fs';
import { COMPLETE_USUL_BOOK } from './publish_complete_usul.mjs';

// 1. Update libraryData.ts
const libPath = 'src/data/libraryData.ts';
let libContent = readFileSync(libPath, 'utf8');

const regex = /\{\s*"id":\s*"usul-ath-thalatha"[\s\S]*?\}\s*,\s*\{\s*"id":\s*"aqeedah-wasitiyyah"/;
const replacement = JSON.stringify(COMPLETE_USUL_BOOK, null, 2) + ',\n  {\n    "id": "aqeedah-wasitiyyah"';

if (regex.test(libContent)) {
  libContent = libContent.replace(regex, replacement);
  writeFileSync(libPath, libContent, 'utf8');
  console.log('✓ Successfully updated src/data/libraryData.ts with complete text of Usul Ath-Thalatha');
} else {
  console.log('Regex did not match in libraryData.ts, check structure');
}

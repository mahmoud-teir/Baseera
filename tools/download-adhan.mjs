import fs from 'node:fs';

async function downloadAdhan() {
  const url = 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Makkah.mp3';
  console.log('Downloading Makkah Adhan...');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed: ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  
  // Ensure directories exist
  fs.mkdirSync('assets/sounds', { recursive: true });
  fs.mkdirSync('android/app/src/main/res/raw', { recursive: true });

  fs.writeFileSync('assets/sounds/adhan_makkah.mp3', buf);
  fs.writeFileSync('android/app/src/main/res/raw/adhan_makkah.mp3', buf);
  console.log('Saved adhan_makkah.mp3 to assets/sounds and android res/raw! Bytes:', buf.length);
}

downloadAdhan().catch(console.error);

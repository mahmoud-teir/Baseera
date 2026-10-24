import fs from 'fs';

const path = 'src/app/(tabs)/(home)/index.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

let targetIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('label={dark ?') && lines[i + 1]?.includes('style={{ width: 44, height: 44')) {
    targetIndex = i + 2;
    break;
  }
}

if (targetIndex !== -1) {
  console.log('Found target at line:', targetIndex);
  console.log('Replacing:', lines.slice(targetIndex, targetIndex + 3).join('\n'));
  lines.splice(targetIndex, 3, '          <DayNightGlyph dark={dark} color={t.primary} background={t.soft} size={22} />');
  fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
  console.log('SUCCESSFULLY_REPLACED');
} else {
  console.log('TARGET_NOT_FOUND');
}

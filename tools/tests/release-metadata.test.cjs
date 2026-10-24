const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const script = resolve(__dirname, '../release-metadata.mjs');
const abis = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'baseerah-packaging-'));
  writeFileSync(join(cwd, 'app-version.json'), JSON.stringify({ version: '1.2.0', androidVersionCode: 4 }));
  const root = join(cwd, 'android/app/build/outputs/apk/release');
  mkdirSync(root, { recursive: true });
  const elements = [...abis, 'universal'].map((abi) => ({
    filters: abi === 'universal' ? [] : [{ filterType: 'ABI', value: abi }],
    versionCode: 4, versionName: '1.2.0', outputFile: `app-${abi}-release.apk`,
  }));
  writeFileSync(join(root, 'output-metadata.json'), JSON.stringify({ elements }));
  for (const [i, element] of elements.entries()) {
    execFileSync('python3', ['-c',
      'import sys,zipfile,json\nwith zipfile.ZipFile(sys.argv[1], "w") as z:\n for abi in json.loads(sys.argv[2]): z.writestr("lib/"+abi+"/libtest.so", "fixture")',
      join(root, element.outputFile), JSON.stringify(i === 4 ? abis : [abis[i]])]);
  }
  return { cwd, root, elements };
}

test('packaging produces immutable universal update URL and all five checksums', () => {
  const { cwd } = fixture();
  try {
    execFileSync(process.execPath, [script, '--package'], { cwd, env: { ...process.env, GITHUB_REPOSITORY: 'owner/app' } });
    const manifest = JSON.parse(readFileSync(join(cwd, 'release-assets/update.json')));
    assert.equal(manifest.apkUrl, 'https://github.com/owner/app/releases/download/v1.2.0/baseerah-universal.apk');
    assert.equal(manifest.latestVersionCode, 4);
    assert.equal(readFileSync(join(cwd, 'release-assets/SHA256SUMS'), 'utf8').trim().split('\n').length, 5);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test('packaging refuses incorrect native architectures', () => {
  const { cwd, root, elements } = fixture();
  try {
    execFileSync('python3', ['-c', 'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1], "w") as z: z.writestr("lib/x86/libbad.so", "fixture")', join(root, elements[0].outputFile)]);
    assert.throws(() => execFileSync(process.execPath, [script, '--package'], {
      cwd, env: { ...process.env, GITHUB_REPOSITORY: 'owner/app' }, stdio: 'pipe',
    }), /Wrong native architectures/);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

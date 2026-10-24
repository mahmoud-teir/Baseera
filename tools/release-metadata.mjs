import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const { version, androidVersionCode } = JSON.parse(readFileSync('app-version.json', 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version) || !Number.isSafeInteger(androidVersionCode)
    || androidVersionCode < 1 || androidVersionCode > 2100000000) {
  throw new Error('app-version.json requires version X.Y.Z and a positive Android versionCode <=2100000000');
}
console.log(`Android release v${version} (build ${androidVersionCode})`);

if (process.argv.includes('--package')) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('GITHUB_REPOSITORY is required');
  const root = 'android/app/build/outputs/apk/release';
  const metadata = JSON.parse(readFileSync(join(root, 'output-metadata.json'), 'utf8'));
  const abis = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
  const seen = new Set();
  const checksums = [];
  mkdirSync('release-assets', { recursive: true });
  for (const element of metadata.elements) {
    const abi = element.filters.find((filter) => filter.filterType === 'ABI')?.value ?? 'universal';
    if (![...abis, 'universal'].includes(abi) || seen.has(abi)) throw new Error(`Unexpected/duplicate APK: ${abi}`);
    if (element.versionCode !== androidVersionCode || element.versionName !== version) throw new Error('APK version does not match app-version.json');
    seen.add(abi);
    const source = join(root, element.outputFile);
    const entries = execFileSync('unzip', ['-Z1', source], { encoding: 'utf8' });
    const actual = [...new Set([...entries.matchAll(/^lib\/([^/]+)\/.+\.so$/gm)].map((match) => match[1]))].sort();
    const expected = abi === 'universal' ? [...abis].sort() : [abi];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Wrong native architectures in ${abi}: ${actual}`);
    const filename = `baseerah-${abi}.apk`;
    copyFileSync(source, join('release-assets', filename));
    const digest = createHash('sha256').update(readFileSync(source)).digest('hex');
    checksums.push(`${digest}  ${filename}`);
  }
  if (seen.size !== 5) throw new Error('Expected universal, ARM64, ARMv7, x86 and x86_64 APKs');
  const universal = readFileSync('release-assets/baseerah-universal.apk');
  const manifest = {
    latestVersion: version,
    latestVersionCode: androidVersionCode,
    apkUrl: `https://github.com/${repository}/releases/download/v${version}/baseerah-universal.apk`,
    releaseNotes: `تحديث بصيرة ${version}: تحسينات وإصلاحات.`,
    isMandatory: false,
    releasedAt: new Date().toISOString(),
    fileSizeBytes: universal.length,
  };
  writeFileSync('release-assets/update.json', JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync('release-assets/SHA256SUMS', checksums.join('\n') + '\n');
}

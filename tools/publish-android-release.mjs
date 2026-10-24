import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' });
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
if (!repository || !sha) throw new Error('Run publication from GitHub Actions');
const manifest = JSON.parse(readFileSync('release-assets/update.json', 'utf8'));
const tag = `v${manifest.latestVersion}`;
const temp = mkdtempSync(join(tmpdir(), 'baseerah-release-'));

// A first release has no latest endpoint. Listing also lets us reject duplicate versions
// without confusing network/authorization errors with an empty repository.
const pages = JSON.parse(gh(['api', `repos/${repository}/releases`, '--paginate', '--slurp']));
const releases = pages.flat();
if (releases.some((release) => release.tag_name === tag)) {
  throw new Error(`${tag} already exists. Bump both fields in app-version.json; never overwrite shipped APKs.`);
}
const published = releases.filter((release) => !release.draft && !release.prerelease);
if (published.length) {
  const latest = JSON.parse(gh(['api', `repos/${repository}/releases/latest`]));
  if (latest.assets.some((asset) => asset.name === 'update.json')) {
    gh(['release', 'download', latest.tag_name, '--repo', repository, '--pattern', 'update.json', '--dir', temp]);
    const previous = JSON.parse(readFileSync(join(temp, 'update.json'), 'utf8'));
    if (!Number.isInteger(previous.latestVersionCode) || manifest.latestVersionCode <= previous.latestVersionCode) {
      throw new Error('androidVersionCode must be greater than the current published build');
    }
  }
}

const notes = join(temp, 'notes.md');
writeFileSync(notes, `Android ${manifest.latestVersion} (versionCode ${manifest.latestVersionCode}).\n\n` +
  'Use baseerah-universal.apk on any supported device, or choose the smaller APK for your architecture. ' +
  'The in-app updater uses update.json and the universal APK. Android installation confirmation is required.\n');
const assets = readdirSync('release-assets').map((file) => join('release-assets', file));
// Keep the release invisible to /latest until every asset has uploaded successfully.
gh(['release', 'create', tag, '--repo', repository, '--target', sha, '--draft', '--title', `Baseerah ${manifest.latestVersion}`,
  '--notes-file', notes, ...assets]);
gh(['release', 'edit', tag, '--repo', repository, '--draft=false', '--latest']);
console.log(`Published ${tag} with ${assets.length} assets`);

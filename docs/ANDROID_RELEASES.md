# Android CI, signing, and in-app updates

`.github/workflows/ci.yml` checks pull requests and pushes to `main`: frozen dependency install, release metadata and plugin tests, TypeScript, lint, Jest, database tests, web export, and Android prebuild.

`.github/workflows/build-apk.yml` builds **signed release APKs** on a change to `app-version.json` on `main`, or through Actions → Signed Android APKs → Run workflow. Manual runs can disable publication to build artifacts only. Publication is restricted to `main`. No Expo/EAS account or paid build service is needed for this workflow.

## One-time repository configuration

Under GitHub → Settings → Secrets and variables → Actions, add these **repository secrets**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 encoding of your existing release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Signing key alias |
| `ANDROID_KEY_PASSWORD` | Signing key password |

Use the **same application signing key as the APKs already installed on devices**. A different key cannot update those installations. A Google Play upload key may differ from the Play app signing key. Do not generate a replacement key for an already distributed app. Keep an offline backup of the original keystore and passwords. Never commit keystores, passwords, or their base64 encodings.

For a genuinely new app with no existing signing identity, create a key locally:

```sh
keytool -genkeypair -v -keystore baseerah-release.jks -alias baseerah -keyalg RSA -keysize 4096 -validity 10000
```

Encode it locally with `base64 -w0 baseerah-release.jks` (Linux), or `base64 -i baseerah-release.jks | tr -d '\n'` (macOS), then enter the result securely as `ANDROID_KEYSTORE_BASE64`. Do not paste it into issues or chat. CI passes passwords through environment variables, fails if credentials are missing, and verifies every APK's signing certificate against the keystore before upload.

Optional **repository variables** are `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only), and `EXPO_PUBLIC_SITE_URL`. These values are embedded in the app and are public. Never use a service-role key. Without them, local features and GitHub-based updates work, while Supabase account/sync features remain unavailable.

Allow Actions to create releases. The publish job requests `contents: write`; organization policies must permit it. Use a **public repository** for unauthenticated app downloads. For a private source repository, publish the assets to a separate public HTTPS location and customize both the workflow publication and `EXPO_PUBLIC_UPDATE_MANIFEST_URL`. Never embed a GitHub token in the app.

## Release a new version

Edit `app-version.json`, for example:

```json
{ "version": "1.2.0", "androidVersionCode": 4 }
```

Increase **both** fields for every published release. The numeric code must exceed every previously distributed build, including any old EAS/local builds. Merge the version change into `main`. Ordinary code pushes run CI; a version-file change also builds and publishes a release. Manual publication uses the checked-out version and refuses an existing release tag. A failed upload leaves a draft: inspect/delete that incomplete draft before retrying, without modifying an already published release.

The workflow generates Android sources using Expo config plugins, then builds all four ABIs with JDK 21 and the SDK/NDK selected by Expo/React Native. It produces:

- `baseerah-universal.apk` — ARMv7, ARM64, x86, and x86_64 together; used by the updater.
- `baseerah-armeabi-v7a.apk` — 32-bit ARM.
- `baseerah-arm64-v8a.apk` — 64-bit ARM.
- `baseerah-x86.apk` — 32-bit Intel.
- `baseerah-x86_64.apk` — 64-bit Intel/emulators.
- `update.json` and `SHA256SUMS`.

All APK variants have the same package ID (`app.baseerah`), versionCode, and certificate, so a newer universal build can replace an architecture-specific installation. Packaging checks the actual native libraries, versions, and expected five outputs. Publication happens only after verification and uploads finish; intermediate drafts are not exposed through the latest-release URL. Build artifacts remain downloadable from the Actions run even when publication is disabled.

## In-app update behavior

Android checks on launch, on foreground resume (at most every five minutes), and from Account → check for updates. The workflow embeds:

```text
https://github.com/OWNER/REPOSITORY/releases/latest/download/update.json
```

The manifest points to the immutable version-tagged universal APK. A strictly greater `latestVersionCode` triggers the existing Arabic update dialog. Download progress is shown, then Android's package installer opens. The user must permit installation from this app and approve the update; Android does not allow ordinary apps to install silently. If needed, enable “Install unknown apps” for Baseerah in Android settings and retry. The APK declares `REQUEST_INSTALL_PACKAGES` for direct distribution. Review Google Play policy before distributing this installer flow through Play.

The existing Supabase admin publishing path is retained as a fallback when no GitHub manifest is available; it now uses the signed-in staff session. A valid GitHub manifest is authoritative, including when the installed app is already current. Older app versions that only know about Supabase need a one-time update through their old admin feed or a manual APK install before GitHub discovery can work.

Changing code alone does not update installed apps: publish a new APK with a higher versionCode. This is a full binary update, not an Expo OTA JavaScript update. No signing secrets or backend admin credentials are required on users' devices.

## Validation limits

CI exercises configuration and unit/database checks; a real signed build requires your signing secrets and a GitHub Actions run. Test installation on a device using the same certificate: install an older build, publish the next version, foreground the old app, accept the update, and confirm user data remains. Test the unknown-source permission and offline paths too.

An embedded admin-password fallback was removed from the updater. Treat that previously committed credential as exposed: rotate it in Supabase and revoke its sessions. New APKs use the user's authenticated session and backend role checks instead.

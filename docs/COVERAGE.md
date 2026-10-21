# Implementation coverage report

Status as of 21 Oct 2026. "Verified" means it was actually executed in this environment (Windows 11, Node 25, Android SDK + emulator, no Mac, no Docker, no Supabase project, no Expo account).

## 1. Imported source

- All 53 files of the Claude Design handoff bundle were read. The mapping is in [TRACEABILITY.md](TRACEABILITY.md).
- `Baseerah Dashboard.dc.html` came from a second export (`design-source/Dashboard.zip`); its other files are identical to the first bundle. It is implemented as the console (section 7b).
- The Claude Design MCP itself could not authenticate in this non-interactive session, so the user-exported bundle was used. Nothing was invented for inaccessible files; none remained.

## 2. Screens (40 prototype screens + additions)

**All prototype screens are implemented as routes:** welcome, home, academy, subject/stub, lesson, quiz, result, answers, locked, map, quran, reader, coach, tajweed, drill, library, folder, book, player, account, notebook, memorized, certificates, settings, supervision, prayer, adhkar, qibla, kaaba, hijri, paths, path, stories, story, sharia list and detail, quotes, plan, review (SRS), khushu.

**Added for real functionality:**
- `auth/sign-in` (Step 1's «لدي حساب · تسجيل الدخول» and the settings account rows) and `auth/password`
- `verify/[code]` (certificate verification)
- Settings sub-pages: reciter, privacy, funding, contact
- City picker
- 404 page

## 3. Components

- **From `components/core`, with their documented props:** Button, Card, Chip, EvidenceBlock, LessonRow, ProgressBar.
- **Additional shared components:**
  - Text, controls and indicators: Txt, Press, Icon, LockIcon, Segmented, ChoiceChips, Toggle (52×30), Ring, Skeleton
  - Badges and slots: Diamond, PendingSlot, EmptyState, EvidenceActions, ReportLink, Pill, StepMark
  - Layout and ornament: Hero, Logo, CornerDiamond, Lattice, WelcomeOrnament, Screen, Column, BackLink, RoundBackHeader, Medallion, FolderCover
- **Overlays:** BottomSheet, EvidenceChainSheet, ReportSheet, Toast, OfflineBanner.

## 4. Animations

| Animation | Implementation |
|---|---|
| Intro film (24 s, 5 scenes) | Reanimated worklets driven by a UI-thread clock, with the same easing (`easeOutCubic`, `easeInOutCubic`, `easeOutBack`) and cue times as the original |
| Bottom sheets | Slide-up `bsUp` (translateY 40 → 0, .25 s, ease-out) with a fading scrim |
| Toast | Same entrance; 2.2 s |
| Skeleton | `bsPulse` (opacity .55 ↔ 1) |
| Progress bars | Width transitions |
| Qibla needle | Rotation transition |
| Kaaba | Auto-rotate and damped orbit |

Reduced motion (the OS setting or «تقليل الحركة») disables all of them, including the intro.

## 5. 3D: Kaaba

- The model is ported mesh for mesh from `Kaaba 3D.html`: W12 × D11 × H13 m, kiswa, hizam, panels, door, Black Stone with frame, shadharwan, mataf, Hijr Ismail.
- The stage behaviour comes from `three-d-stage.js`: hemisphere + key + fill lights, PCF soft shadows, 18% shadow ground, auto-framing, damping 0.08, auto-rotate speed 1.2 that stops on interaction.
- **Rendering:** WebGL via react-three-fiber on the web; expo-gl on native.
- **Input:** drag to orbit, pinch to zoom, and mouse wheel on the web.
- There is an error fallback with retry if WebGL is unavailable.

## 6. Qibla

- **Bearing:** great-circle formula, same as `Qibla Map.html`. Unit-tested: Cairo 136°, London 119°, New York 58.5°, Jakarta 295°, Istanbul 151.6°.
- **Distance:** haversine.
- **Compass card:**
  - Uses the live device heading: expo-location `watchHeadingAsync` on native; `DeviceOrientationEvent` on the web, including the iOS Safari permission gesture.
  - Shows explicit messages when there is no sensor, the permission is denied, there is no location, or accuracy is low (calibrate).
  - Never shows a fake angle.
- **Map:**
  - Azimuthal-equidistant projection centred on Makkah, drawn in react-native-svg with d3-geo.
  - The world-atlas land data is bundled, so the map works offline.
  - «موقعي» plus the prototype's six example cities.

## 7. Backend (Supabase)

**Migration, all with RLS:**
- User data: `profiles` (auto-created by trigger), `user_state` (sync snapshot), `quiz_attempts`, `certificates`, `push_tokens`.
- Content and review: `lesson_keys` (server-only answer keys), `stage_requirements`, `content_items` (published-only reads; publishing without a source is rejected), `reviewers`, `changelog`.
- Reports and access: `reports`, `feedback`, `staff`.

**Edge Functions:**
- `submit-report`: validation, plus rate limiting by user or hashed IP.
- `grade-quiz`: server-side grading.
- `issue-certificate`: re-checks every lesson of the stage and the published lesson count, then mints a `BSR-…` code.
- `verify-certificate`: public lookup.
- `delete-account`: cascades to all of the user's data.

**Client:**
- Optional email/password and magic-link auth.
- Local-first sync with last-write-wins plus union merges.
- An offline queue for reports.
- Certificate PDF via expo-print.
- Data export (JSON).
- Push-token registration for content updates.

## 7b. Baseerah Console and published content

**No content ships in the app.** `lessons.json` and `quotes.json` (placeholder text from the design bundle), the demo library items and every «(تجريبي)» label were removed.

Everything the learner reads comes from `published_content` in Supabase, after approval in the console. The app caches it for offline use and refreshes it at launch, on reconnect and when it returns to the foreground. An empty slot shows «بانتظار التوثيق».

**What stays bundled.** Only structure ships with the app: subject names and the 53-lesson curriculum outline (an editable default), the 114 surahs with Tanzil text, knowledge-map nodes, the names of prophets, angels and companions, encyclopedia topic names, path names and calendar events.

**Content slots managed from the console → where they appear in the app:**

| Kind (slot) | App screen |
|---|---|
| lesson (`AQ-01` …) | academy, lesson, quiz, result, answers, khushu, review cards (keyed by question id), plan, home |
| evidence (`AQ-01/e1`) | lesson evidence blocks and the evidence-chain sheet (inference, explanation, level, reviewers) |
| quote | quotes screen, «قول اليوم», home carousel |
| story (`prophets/0`) | story sections |
| sharia (`0/1`) | encyclopedia sections |
| adhkar (`morning`) | adhkar texts, counts and sources; counters keyed by item id |
| tafsir (surah number) | reader tafsir tab (loaded per surah) |
| tajweed (topic index), drill (`main`) | tajweed topics, the listening drill with audio |
| path (id) | path steps linked to app routes |
| map (node id) | knowledge-map link tiles |
| page (`funding`) | funding page |
| book, audio | library, book reader, player |

**Console:**
- **Views:** the design's 11 views, plus a content catalog and contact messages. All are pre-rendered at `/admin/[view]`.
- **Language:** the design's English/Arabic copy is used verbatim, with additions marked. Arabic is RTL.
- **Editors:** every kind has a form-based editor. It covers lists, repeatable items, quiz options with the correct answer, keyed sections and ayah-by-ayah tafsir. Audio is uploaded to the `media` bucket on the web, or entered as a URL.
- **Lessons view:** all 53 curriculum slots, with Changes (draft vs published) and a phone preview built from the real draft. The curriculum card (planned counts and pass mark) is admin-only.
- **Team:** add or change members by email, change roles and remove them. The last admin cannot be removed.
- **Other admin tools:** manage published reviewers, and mark contact messages read or done.
- **Workflow:** send, approve (two scholars for lessons, one for everything else), reject, reopen, delete. Bulk «Advance» is available.
- **«Notify learner»:** writes an in-app notification and sends an Expo push through `notify-reporter`. The app has a notifications screen under «حسابي».
- **Live data only:** the overview KPIs, weekly bars and pipeline are live counts. There is no sample mode. Without a backend the console shows «Backend not connected».
- **Access:** sign-in is required, plus a staff role. Only admins can preview other roles, and the server always applies the real role.

**Prayer & calendar and curriculum defaults** (`app_config`) drive these app settings until the user changes them:
- calculation method
- prayer notifications
- Hijri ±2 days
- the high-latitude rule
- the daylight-saving display
- planned lesson counts, which also set the certificate requirement
- pass mark

**Not built:**
- A custom adhan sound needs a licensed file bundled into the native build.
- Scholars' «Pending / Reviewed» counts are not shown, because reviewer records are not linked to staff accounts.

## 7c. Security review (21 Oct 2026, live project)

**Method:**
- the Supabase security advisor on the live project
- anonymous probes of every table and RPC against the live API
- a read of the RPCs, Edge Functions and storage policies
- a read of the app and console for injection and redirect risks

**Fixed (migration `20261023000000_hardening.sql`, functions redeployed):**
1. **Report rate limit could be bypassed.** `submit-report` keyed the limit on the first, client-forged, `X-Forwarded-For` entry. It now uses the proxy-appended entry, with a 300-per-hour global ceiling.
2. **«تواصل معنا» had no limit.** Anonymous clients inserted rows directly. Direct inserts are now closed; messages go through the new `submit-feedback` function (5 per 10 minutes per client, 200 per hour in total).
3. **SECURITY DEFINER view.** `published_content` is now `security_invoker`. Clients have column-level SELECT on published columns only, and staff read drafts through `admin_content()`.
4. **Mutable search_path** on `cms_blank`, `cms_check` and `touch_updated_at`: fixed.
5. **Least-privilege EXECUTE.** No function in `public` is callable signed-out. Signed-in users get only the app and console RPCs, and each admin RPC checks the staff role first. Internal helpers (`require_perm`, `cms_check`, `audit`, `handle_new_user`) are not callable at all.
6. **`media` bucket:** 200 MB size limit and an audio/image MIME allow-list.
7. **Published URLs:** audio must be `https`, and path and map targets must be in-app routes. This blocks `//host` and `javascript:` links.
8. **Web headers** (`vercel.json`, `public/_headers`): `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` stop the console being framed (clickjacking). HSTS and `nosniff` are also set.
9. **Auth:** server-side minimum password length is 8.

**Verified after the fix:**
- **Advisor:** dropped from 44 notes (including 1 error) to 3 expected ones:
  - `lesson_keys` has no client policy, by design;
  - the console RPCs are executable by signed-in users, and each one checks the role;
  - leaked-password protection is unavailable on the free plan.
- **Live probes:** signed-out clients get permission denied on draft columns, `has_perm` and direct feedback inserts.
- **Tests:** PGlite 86 / 86 (the harness now uses Supabase-style default privileges), Jest 49 / 49, E2E 114 / 114.

**Already sound, unchanged:**
- RLS on every table; owner-only user data; answer keys server-only; server-graded certificates.
- Staff writes only through RPCs; an audit log that cannot be forged; at least one admin is always kept.
- The secret key is never in the bundle (checked in the export). Certificate HTML is escaped, and React Native text rendering has no HTML injection surface.

**Remaining actions for the owner:**
- Rotate the database password, the secret key and the access token, all of which were pasted into chat.
- Set `ALLOWED_ORIGIN` for the functions once the site is hosted.
- Leaked-password protection needs Supabase Pro.

## 8. Platform adaptations

**RTL:**
- Native: `forcesRTL` through the expo-localization plugin, plus `I18nManager`.
- Web: `dir="rtl"` and `lang="ar"`.
- Explicit `dir` on text on the web, because react-native-web's `dir="auto"` reorders lines that start with a Latin code.
- An `edge` helper, because react-native-web resolves `start`/`end` as LTR.
- Directional icons mirror automatically.
- LTR islands for codes and times.

**Responsive:** a bottom tab bar below 768 px; above that, a 150 px side rail with a centred 620/700 px column (the prototype's tablet and landscape modes).

**Web:**
- 1,010 pre-rendered static pages (all 53 planned lesson codes and the 13 console views), so direct loads work for every known route.
- Hosting rewrites for the three backend-id routes.
- Hydration-safe theme, layout and clock, so the static HTML matches the first client render.
- Focus rings, hover states, Escape to close sheets.
- Mouse-wheel zoom on the Kaaba.
- Share and clipboard fallbacks.

**Native:**
- Safe areas and the Android back button (closes sheets).
- Background audio with lock-screen controls.
- Local notifications: prayers, adhkar, daily lesson, seasons, quiz retry.
- File downloads for offline recitation.
- Haptics are not used, because the design says "press = slight dim, no scale".

## 9. Tests executed

| Suite | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `expo lint` (incl. React Compiler rules) | ✅ 0 problems |
| Jest unit and component tests | ✅ 49 / 49. Covers: content model (lessons and evidence built from published rows, invalid rows dropped, curriculum outline); Qibla, prayer times, Hijri, unlocking, 85% scoring, SRS by question id, knowledge map, streak, sync merge, honorifics, colour; console (role matrix, view access, no-backend state, Advance rules, chips, error texts, audit translation, CSV); prayer defaults (method/notification defaults with user override, Hijri ±days, high-latitude, DST); the six core components. Test lessons are defined inside the tests. |
| Backend SQL and RLS on PGlite | ✅ 75 / 75. Covers: no seed content; drafts invisible to clients and the table unreadable; staff cannot publish by direct writes; per-kind validation (slots, pass mark, answers); lesson needs two distinct scholars, then writes the answer key and a changelog entry; edits stay private until re-approved; sources required for evidence, quotes, adhkar, stories, tafsir and audio; reject/reopen; delete rules; report lifecycle with the reporter notification (owner-only, server-written); team management by email with last-admin protection; feedback triage; reviewer publishing; prayer and curriculum config (curriculum sets the certificate requirement); audit log; analytics gating; plus the earlier RLS checks. |
| Playwright web E2E (export pointed at a fake Supabase, fixtures in `e2e/`) | ✅ 114 tests (38 scenarios × phone 390, tablet 820, desktop 1280) in the last full run, except one timing flake: «dark mode and font size persist» failed once under full parallel load, then passed 9 / 9 on its own. Covers: nothing published → pending slots everywhere and no demo text; published lessons, quotes, adhkar counters, path links, funding, library and tafsir; the quiz pass/fail flows on published lessons; console sign-in and no-access gates, queue send/approve RPCs, lesson draft save, adhkar editor, «Notify learner» push, team, inbox, prayer config, role gating, RTL, ⌘K, overflow; plus the earlier app scenarios. |
| Route smoke test (51 routes, dev and prod) | ✅ No runtime or hydration errors (the 404 route is expected) |
| Visual review | Screenshots of every route at 390×844 and key routes at 1280×800, compared with the prototype |
| Android | See section 10 |
| iOS | ❌ Not executed. No Mac, and no Expo or Apple accounts. |

## 10. Android verification

_Filled in after the local Gradle build and the emulator run. See the final status below._

## 11. Remaining limitations and external blockers

1. **iOS** has not been built or tested: there is no macOS here, and no Apple Developer or Expo account was provided. The EAS profiles `simulator` and `production` are ready.
2. **Supabase (project `yxqdquynlgfbxyultsux`, Seoul) is provisioned. No content has been entered yet.**
   - **Done and checked (21 Oct 2026):**
     - The three migrations were pushed to the live database. The direct host is IPv6-only, so the push went through the IPv4 session pooler.
     - Anonymous access was checked against the live API: `app_config` and `stage_requirements` are public; `published_content` is empty; `content_items`, `lesson_keys` and `reports` return nothing; admin RPCs refuse with `forbidden`.
     - The `media` storage bucket exists.
     - A production web export pointed at the project loads published content and config (HTTP 200) with no errors, and the console asks for a staff sign-in.
   - **First admin:** the account that signed up and confirmed its email was added to `staff` as `admin` on 21 Oct 2026.
   - **Edge Functions:** all six are deployed with server-side bundling: `submit-report`, `grade-quiz`, `issue-certificate`, `verify-certificate`, `delete-account` and `notify-reporter`. `REPORT_SALT` is set. Each was probed without writing data:
     - `verify-certificate` → `{valid:false}`
     - `submit-report` rejects invalid input (400)
     - the four signed-in functions refuse anonymous calls (401)
   - **Auth:** the site URL and redirect URLs from `config.toml` were pushed. Only those 2 properties changed.
   - **Not verified yet:**
     - **Signed-in flows on the live project:** console actions, quiz grading, certificates, media upload, and push delivery. They need someone signed in.
     - **Production URLs:** the site and redirect URLs still point to local development. Add the production site when hosting is chosen.
3. **EAS builds and web hosting** were not run. They need an Expo account; the hosting choice was deferred by you.
4. **No content is published yet.** Every lesson, evidence card, quote, adhkar text, biography, encyclopedia entry, tafsir, tajweed lesson, drill clip, library item, reviewer and the funding report must be entered and approved in the console. Stage-1 certificates need every planned lesson to be published.
5. **English UI:** marked "coming later" in the source; the option shows a notice.
6. **Answer keys reach the client with published lessons**, so learners can score offline and review their answers. Certificates rely only on server-graded attempts against `lesson_keys`.
7. **The web cannot download recitations for offline use**, so it shows a notice. The web has no local notifications either.
8. **The JS bundle is about 2.35 MB** for the shared chunk before gzip. three.js and the Qibla map are code-split, and the Quran text loads as a separate cached asset.

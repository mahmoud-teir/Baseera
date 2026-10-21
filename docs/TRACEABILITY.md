# Traceability: design source → implementation

Source: the Claude Design handoff bundle `design-source/Mobile app design walkthrough-handoff.zip`, exported from the project "Mobile app design walkthrough". Every file in it was read.

The Claude Design MCP could not authenticate in this environment, because `/design-login` needs an interactive session. The user exported the bundle instead.

## Files

| Source file | Role | Implemented in |
|---|---|---|
| `Baseerah Prototype.dc.html` | Functional spec: ~40 screens, state, handlers, data | All routes in `src/app/**` (screen table below) |
| `Baseerah Step 1.dc.html` | Design-system page plus static welcome, home, academy, subject, lesson, quiz, result and review screens | `src/theme/tokens.ts`, `src/components/core/*`, matching routes |
| `Baseerah Missing Ideas.dc.html` | Daily plan, spaced review, scholarly supervision, khushu mode | `(home)/plan.tsx`, `(home)/review.tsx`, `account/settings/supervision.tsx`, `khushu/[code].tsx` |
| `Baseerah Intro Vertical.html` | 24 s intro (5 scenes) | `src/features/intro/Intro.tsx`, `src/animations/timeline.ts`; shown on `welcome.tsx` |
| `Baseerah Intro Video.html` | Landscape version of the same film (not referenced by the prototype) | Same scenes; the vertical cut is used in-app |
| `Kaaba 3D.html` | three.js Kaaba model | `src/three/kaaba.ts` (same meshes, dimensions and materials), `src/features/kaaba/KaabaScene.tsx`, `(home)/prayer/kaaba.tsx` |
| `three-d-stage.js` | Generic three.js stage: lights, shadow ground, framing, orbit, auto-rotate | `KaabaScene.tsx`: same lights, 18% shadow ground, framing formula, damping 0.08, auto-rotate 1.2 |
| `Qibla Map.html` | Azimuthal-equidistant map centred on Makkah, bearing and distance | `src/features/qibla/QiblaMap.tsx`, `src/services/qibla.ts` (same formulas), `(home)/prayer/qibla.tsx` |
| `animations-v3.jsx` | Generic timeline engine (Easing, `animate`, `CompositionStage`) | Ported easing and `animate` as Reanimated worklets in `src/animations/timeline.ts` |
| `tweaks-panel.jsx` | Generic designer tweak panel | Not an app feature. The real tweak props (mood, ornament, cardStyle) become `THEME_CONFIG` in `tokens.ts` |
| `Baseerah Dashboard.dc.html` (from `design-source/Dashboard.zip`) | Staff console: 11 views, roles, review workflows, en/ar copy | `src/app/admin/*`, `src/features/admin/*`. Backend: `backend/supabase/migrations/20261021000000_admin_console.sql`. Defaults: `src/state/config-store.ts`. See the console table below. |
| `support.js` | Generic `.dc.html` runtime | Not needed in production (no app logic) |
| `components/core/Button.*` | Primary, secondary and locked button | `src/components/core/Button.tsx` (props from `.d.ts` kept; `onPress` alias; CTA sizes) |
| `components/core/Card.*` | Border, shadow and tint card | `src/components/core/Card.tsx` (+ `app` = app-wide card style) |
| `components/core/Chip.*` | Status and filter chip | `src/components/core/Chip.tsx` (+ `outline` filter variant) |
| `components/core/EvidenceBlock.*` | Verified or pending evidence | `src/components/core/EvidenceBlock.tsx`. Text is never shown without a source. |
| `components/core/LessonRow.*` | Done, current and locked row | `src/components/core/LessonRow.tsx` |
| `components/core/ProgressBar.*` | Progress 0–100, light variant | `src/components/core/ProgressBar.tsx` (animated width, a11y value) |
| `components/core/core.card.html`, `ui_kits/baseerah/*` | Component showcase and a 3-screen click demo | Covered by the components above and the full route set |
| `guidelines/*.html` | Colour, type, spacing and component specs | `src/theme/tokens.ts`, `src/theme/fonts.ts` |
| `tokens/colors.css`, `spacing.css`, `typography.css`, `styles.css` | Design tokens | `src/theme/tokens.ts` (`brand`, `space`, `radius`, `shadow`, `motion`, `type`) |
| `lessons/lessons.json`, `lessons/README.md` | 8 AQ lessons (placeholder text) and their schema | The schema is kept in `src/data/content.ts` (`LessonDataSchema`). The placeholder lessons are **not shipped**: lessons are written in the console and read from `published_content`. |
| `quotes/quotes.json` | 2 quote slots (all pending) | Not shipped. Quotes are published from the console (kind `quote`). |
| `HANDOFF.md` | Rules, tokens, screens, data model, logic, accessibility, open items | See the sections below |
| `readme.md`, `SKILL.md` | Brand voice, visual foundations, no-fabrication rule | Copy style, `PendingSlot` / `EvidenceBlock` behaviour |
| `uploads/Muhammad_Masjid_an-Nabawi_Calligraphy.svg.png` | Defined but never rendered in the prototype (`MUH`) | Not used, as in the prototype |
| `uploads/draw-*.png`, `uploads/figma_design_basics_detailed_notes.docx` | Designer notes | Not app content |

## Screens (`s.<key>` in the prototype → route)

| Prototype | Route | Notes |
|---|---|---|
| welcome | `/welcome` | Intro film on first launch, «تخطّي», «ابدأ رحلتك», «لدي حساب» (from Step 1) |
| home | `/` | All cards; prayer, plan, review and map tiles now show real data |
| academy | `/academy` | Stage stepper, 6 subjects, map entry |
| subject | `/academy/subject/[id]` | AQ lessons; other subjects show «شاشة قادمة» (the prototype's `stub`) |
| stub | `/academy/subject/[id]` (subjects without lessons) | |
| lesson | `/academy/lesson/[code]` | Objectives, sections, evidence, «اعرف الدليل», «أبلغ عن خطأ», audio, summary |
| quiz, result, review | `/lesson/[code]/quiz`, `/result`, `/answers` | Full screen, no tab bar |
| locked | `/academy/locked/[stage]` | |
| map | `/academy/map` | 19 nodes, edges, detail sheet |
| quran | `/quran` | 114 surahs (the prototype listed 9), bookmark folders, memorisation tab |
| reader | `/reader/[surah]` | Real Tanzil text, recitation, ayah sheet, paper mode, downloads |
| coach | `/coach/[surah]` | Real ayahs, any surah |
| tajweed, drill | `/quran/tajweed`, `/drill` | |
| library, folder | `/library`, `/library/folder/[id]` | |
| book, player | `/book/[id]`, `/player/[id]` | |
| account | `/account` | |
| notebook, memorized, cert | `/account/notebook`, `/account/memorized`, `/account/certificates` | |
| settings, sup | `/account/settings`, `/account/settings/supervision` | Plus reciter, privacy, funding, contact, and `/auth/*` for the account rows |
| prayer, adhkar, qibla, kaaba | `/prayer`, `/prayer/adhkar/[cat]`, `/prayer/qibla`, `/prayer/kaaba` | |
| hijri | `/hijri` | |
| paths, path | `/paths`, `/paths/[id]` | |
| stories, story | `/stories`, `/stories/[tab]/[i]` | |
| sharia (list / detail) | `/sharia`, `/sharia/[topic]/[sub]` | |
| quotes | `/quotes` | |
| plan, srs | `/plan`, `/review` | |
| khushu | `/khushu/[code]` | |
| Overlays: evidence chain, report, toast, offline banner | `src/components/overlays/*` | Global, opened from anywhere |
| Device modes phone / tablet / landscape | `src/theme/layout.ts`, `src/app/(tabs)/_layout.tsx` | Bottom bar below 768 px; 150 px side rail at 768 px and above; 620 / 700 px column |

## Console (`Baseerah Dashboard.dc.html` → `/admin/[view]`)

| Design | Implementation |
|---|---|
| `S.en` / `S.ar` string tables | `src/features/admin/strings.ts` (verbatim; additions marked) |
| `VIEWS` (view → section → roles) and the role matrix | `strings.ts` `VIEWS`, `MATRIX`. SQL: `has_perm()` |
| Top bar (logo, sections, ⌘K, Alerts, role select, language) | `Console.tsx` `Shell` |
| Sub-tabs, search modal, toast (the MOCK banner is dropped: no sample data) | `Console.tsx` |
| `v.overview`: KPIs, weekly bars, pipeline | `views.tsx` `OverviewView`. Live: `admin_overview()` |
| `v.split` (queue / evidence / reports): list, bulk, detail, stepper, fields, actions, history | `views.tsx` `SplitView` and `Detail`. Live: `admin_transition()` and `audit_log` |
| `v.lessons`: edit, diff, phone preview, export | `views.tsx` `LessonsView` + `editor.tsx` (full lesson editor). Live: `content_items` kind lesson, `admin_save_draft()` |
| `v.table`: scholars, library, learners, certs (+ verify), roles (+ audit) | `views.tsx` `TableView`. Live: `reviewers`, `content_items`, `admin_learner_stats()`, `admin_certificates()`, `verify-certificate` |
| `v.prayer`: method, Hijri adjustment, 3 toggles | `views.tsx` `PrayerView`. Live: `app_config` via `admin_save_config()`. Applied in `app-store` `settingDefault`, `hijri.ts` and `prayer.ts` |
| `<select>`, `<input type=range>`, checkboxes and toggles | `controls.web.tsx` (native elements on the web), `controls.tsx` (option sheet and gesture slider on native), `ui.tsx` |
| `download` / `exportRows` | `download.ts` (Blob on the web, share sheet on native) |
| `state.items` sample data | Not used. The console reads live data only. |

| (added) content catalog, contact messages, team, curriculum | `views.tsx` `CatalogView`, `InboxView`, `TeamCard`, `CurriculumCard`; migrations `20261021000000_admin_console.sql`, `20261022000000_cms.sql` |

## HANDOFF.md coverage

| HANDOFF section | Implementation |
|---|---|
| §1 Non-negotiables (no fabrication, free, Quran/library always open, educational only, reliability levels) | Pending slots everywhere. `content_items` refuses to publish unsourced items. The evidence chain shows the 4 levels. No prices or ads. The stage lock never blocks Quran or library. |
| §2 Platform (mobile-first 390, full RTL, dark mode, font size ×3, line spacing ×3, contrast, reduced motion, 44 px targets) | `theme.tsx`, `layout.ts`, settings section 1. Touch targets ≥ 44 throughout. |
| §3 Tokens, fonts, spacing, ornament, icons | `tokens.ts`, `fonts.ts`, `Ornament.tsx` (8-point star, 45° lattice), `Icon.tsx` (stroke 1.8–2.2, round caps) |
| §4 Components (Button, Chip/Segmented, Card, BottomSheet, ProgressBar/Ring, Toggle 52×30, Toast 2.2 s, EvidenceBlock, Report/Evidence buttons, TabBar) | `components/core/*`, `components/overlays/*` |
| §5 Screens and states (skeleton, empty, error/offline, toast) | All screens. Skeletons in library, reader, coach and hijri. Offline banner via NetInfo. |
| §6 Data model (lessons, quotes, levels, knowledge map, server entities) | `content.ts`, `structural.ts`. Server tables listed in the migration. |
| §7 Logic (unlock ≥ passPct, stage lock, certificate with verification code, spaced review 1 day → 1 week, memorisation schedule, prayer times from location + method + Asr + ±2 min, Qibla from location and sensors, Hijri, reports with location text, offline downloads, autosave and optional sync) | `app-store.ts`, `prayer.ts`, `qibla.ts`, `hijri.ts`, `reports.ts`, `downloads.ts`, `sync.ts`, `grade-quiz` and `issue-certificate` |
| §8 Accessibility (4.5:1 contrast, gold-ink text, aria labels, RTL focus order, Arabic screen reader, meaning not by colour alone, `prefers-reduced-motion`) | Press, Txt and the a11y props. LessonRow states carry text. Reduced motion is honoured, including the intro. |
| §9 Open items | Listed under limitations in [COVERAGE.md](COVERAGE.md) |

## Prototype bugs fixed (flagged in the analysis)

1. After re-passing an older lesson, «العودة إلى المادة» went to the current lesson. It now goes to the subject.
2. The home plan tile hard-coded "من 3 مهام". It now shows the real task count (4 for 30 minutes).
3. Individual angels used the plural «عليهم السلام». They now get «عليه السلام»; groups keep the plural.
4. Settings values (calculation method, speed, …) had no effect. They now drive prayer times, notifications, audio speed, reciter and quality.
5. The ±15 s buttons and the ayah previous/next controls were inert. They now work.
6. The Qibla needle used a fake angle and «معايرة» rotated it by 40°. It now uses the real bearing and device heading, and «معايرة» restarts the sensor with calibration guidance.

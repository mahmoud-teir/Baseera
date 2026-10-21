// Runs the Supabase migrations + seed on an in-process Postgres (PGlite) with a minimal stand-in for
// Supabase's auth schema and roles, then checks constraints, row-level security and the console's
// publishing workflows. This validates SQL and RLS logic; it does not exercise Supabase Auth, Storage
// or the Edge Functions. All content below is test fixture data that exists only inside this script.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const db = new PGlite();
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok ' : 'FAIL'} ${msg}`);
  if (!cond) failures++;
};
const expectError = async (sql, msg) => {
  try {
    await db.exec(sql);
    ok(false, msg + ' (expected an error)');
  } catch {
    ok(true, msg);
  }
};

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  -- Supabase's default privileges: every new table/sequence/function in public is granted to the API
  -- roles at creation time, so later REVOKEs in the migrations take effect.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);

const migDir = join(root, 'backend/supabase/migrations');
for (const f of readdirSync(migDir).sort()) await db.exec(readFileSync(join(migDir, f), 'utf8'));
await db.exec(readFileSync(join(root, 'backend/supabase/seed.sql'), 'utf8'));
ok(true, 'migrations + seed applied');
ok((await db.query('select count(*)::int as n from public.content_items')).rows[0].n === 0, 'seed: no sample content ships');
ok((await db.query('select count(*)::int as n from public.lesson_keys')).rows[0].n === 0, 'seed: no answer keys until a lesson is published');

const A = '11111111-1111-1111-1111-111111111111'; // learner
const B = '22222222-2222-2222-2222-222222222222'; // scholar 1
const C = '33333333-3333-3333-3333-333333333333'; // content editor
const S2 = '44444444-4444-4444-4444-444444444444'; // scholar 2
const M = '55555555-5555-5555-5555-555555555555'; // moderator
const AD = '66666666-6666-6666-6666-666666666666'; // admin
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
  ('${A}', 'a@test.local', '{"display_name":"أحمد"}'), ('${B}', 'b@test.local', '{"display_name":"مراجع أول"}'), ('${C}', 'c@test.local', '{}'),
  ('${S2}', 's2@test.local', '{"display_name":"مراجع ثان"}'), ('${M}', 'm@test.local', '{}'), ('${AD}', 'ad@test.local', '{}')`);
ok((await db.query(`select count(*)::int as n from public.profiles`)).rows[0].n === 6, 'profile trigger creates profiles');

const as = async (role, uid, sql) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec('reset role;');
  }
};
const rpc = (uid, sql) => as('authenticated', uid, sql);
const fails = async (uid, sql, msg) => {
  try {
    await rpc(uid, sql);
    ok(false, msg + ' (expected an error)');
  } catch {
    ok(true, msg);
  }
};
/** Same as `fails`, but as a signed-out (anon) client. */
const failsAnon = async (sql, msg) => {
  try {
    await as('anon', null, sql);
    ok(false, msg + ' (expected an error)');
  } catch {
    ok(true, msg);
  }
};
const lit = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;

// ── User data ───────────────────────────────────────────────────────────────
await db.exec(`insert into public.user_state (user_id, data) values ('${A}', '{"passed":{}}'), ('${B}', '{"passed":{"AQ-01":{}}}')`);
const own = await as('authenticated', A, 'select user_id from public.user_state');
ok(own.rows.length === 1 && own.rows[0].user_id === A, 'user_state: a user sees only their own row');
ok((await as('anon', null, 'select * from public.user_state')).rows.length === 0, 'user_state: anonymous sees nothing');
await as('authenticated', A, `update public.user_state set data = '{}' where user_id = '${B}'`);
ok(JSON.stringify((await db.query(`select data from public.user_state where user_id = '${B}'`)).rows[0].data).includes('AQ-01'), 'user_state: cannot overwrite another user');

// ── Feedback & reports ──────────────────────────────────────────────────────
// Feedback arrives only through the rate-limited submit-feedback function (service role).
await failsAnon(`insert into public.feedback (message) values ('اقتراح للتطبيق')`, 'feedback: no direct inserts from clients (rate-limited function only)');
await db.exec(`set role service_role; insert into public.feedback (message, client_hash) values ('اقتراح للتطبيق', 'h'); reset role;`);
ok((await db.query('select count(*)::int as n from public.feedback')).rows[0].n === 1, 'feedback: the function (service role) stores messages');
await expectError(`insert into public.feedback (message) values ('قصير')`, 'feedback: too-short messages are rejected');
ok((await as('authenticated', A, 'select * from public.feedback')).rows.length === 0, 'feedback: non-staff cannot read feedback');
await db.exec(`insert into public.reports (where_text, reason, user_id) values ('الدرس AQ-01 · الشرح', 'خطأ في النص', '${A}')`);
await expectError(`insert into public.reports (where_text, reason) values ('x', 'سبب غير معروف')`, 'reports: unknown reasons are rejected');
ok((await as('authenticated', A, 'select * from public.reports')).rows.length === 0, 'reports: non-staff cannot read reports');

// ── Staff ───────────────────────────────────────────────────────────────────
await db.exec(`insert into public.staff (user_id, role) values ('${AD}', 'admin')`);
await expectError(`insert into public.staff (user_id, role) values ('${A}', 'reviewer')`, 'staff: legacy/unknown roles are rejected');
await fails(C, `select public.admin_set_staff('b@test.local', 'scholar')`, 'staff: only admins can grant roles');
for (const [email, role] of [['b@test.local', 'scholar'], ['c@test.local', 'content'], ['s2@test.local', 'scholar'], ['m@test.local', 'mod']]) {
  await rpc(AD, `select public.admin_set_staff('${email}', '${role}')`);
}
const staff = await rpc(AD, 'select email, role from public.admin_list_staff()');
ok(staff.rows.length === 5 && staff.rows.some((r) => r.email === 'b@test.local' && r.role === 'scholar'), 'staff: admin grants roles by email and lists the team');
await fails(AD, `select public.admin_set_staff('nobody@test.local', 'mod')`, 'staff: unknown emails are refused');
await fails(AD, `select public.admin_remove_staff('${AD}')`, 'staff: the last admin cannot be removed');
await fails(AD, `select public.admin_set_staff('ad@test.local', 'content')`, 'staff: the last admin cannot be demoted');
ok((await as('authenticated', B, 'select * from public.reports')).rows.length === 1, 'reports: staff can read reports');

// ── Content: drafts are private, approved copies are public ────────────────
const Q = (id, answer) => ({ id, q: 'سؤال اختبار', options: ['أ', 'ب', 'ج', 'د'], answer, explain: '' });
const lesson = { title: 'درس اختبار', minutes: 10, objectives: ['هدف'], sections: [{ heading: 'الشرح', body: 'نص' }], summary: ['ملخص'], quiz: { passPct: 80, questions: [Q('q1', 2), Q('q2', 0)] } };
await fails(B, `select public.admin_save_draft('lesson', 'AQ-01', ${lit(lesson)})`, 'content: scholars cannot write drafts');
await fails(C, `select public.admin_save_draft('lesson', 'XX-01', ${lit(lesson)})`, 'content: invalid slot keys are refused');
await fails(C, `select public.admin_save_draft('lesson', 'AQ-01', ${lit({ ...lesson, quiz: { passPct: 40, questions: [] } })})`, 'content: pass threshold below 50 is refused');
await fails(C, `select public.admin_save_draft('lesson', 'AQ-01', ${lit({ ...lesson, quiz: { passPct: 80, questions: [{ ...Q('q1', 7) }] } })})`, 'content: a correct answer outside the options is refused');
const lid = (await rpc(C, `select public.admin_save_draft('lesson', 'AQ-01', ${lit(lesson)}) as id`)).rows[0].id;
ok((await as('anon', null, `select * from public.published_content`)).rows.length === 0, 'content: drafts are not visible to the app');
await failsAnon(`select data from public.content_items`, 'content: signed-out clients cannot read draft columns');
await fails(A, `select data from public.content_items`, 'content: signed-in learners cannot read draft columns');
await rpc(C, `update public.content_items set published_data = data where id = '${lid}'`).catch(() => {});
ok((await db.query(`select published_data from public.content_items where id = '${lid}'`)).rows[0].published_data === null, 'content: staff cannot publish with a direct write');

// Lesson workflow: send → two different scholars → published
await fails(C, `select public.admin_transition('ct', '${lid}', 'approve')`, 'workflow: content editors cannot approve');
ok((await rpc(C, `select public.admin_transition('ct', '${lid}', 'send') as s`)).rows[0].s === 'review', 'workflow: content sends the lesson for review');
ok((await rpc(B, `select public.admin_transition('ct', '${lid}', 'approve') as s`)).rows[0].s === 'review', 'workflow: one approval keeps a lesson in review');
await fails(B, `select public.admin_transition('ct', '${lid}', 'approve')`, 'workflow: the same scholar cannot approve twice');
ok((await rpc(S2, `select public.admin_transition('ct', '${lid}', 'approve') as s`)).rows[0].s === 'published', 'workflow: a second scholar publishes the lesson');
const pubRows = (await as('anon', null, `select kind, slot, data from public.published_content`)).rows;
ok(pubRows.length === 1 && pubRows[0].slot === 'AQ-01' && pubRows[0].data.title === 'درس اختبار', 'content: the published lesson is readable by the app');
const key = (await db.query(`select pass_pct, answers from public.lesson_keys where code = 'AQ-01'`)).rows[0];
ok(key?.pass_pct === 80 && JSON.stringify(key.answers) === '[2,0]', 'workflow: publishing writes the server answer key and pass mark');
const cl = (await as('anon', null, `select item, summary, approved_by from public.changelog`)).rows;
ok(cl.length === 1 && cl[0].summary === 'نُشر' && cl[0].approved_by.includes('مراجع أول') && cl[0].approved_by.includes('مراجع ثان'), 'workflow: publishing adds a public changelog entry with the approvers');
ok((await as('authenticated', A, 'select * from public.lesson_keys')).rows.length === 0, 'lesson_keys: answer keys are not readable by clients');
await fails(A, `insert into public.quiz_attempts (user_id, code, answers, pct, passed) values ('${A}', 'AQ-01', '{2,0}', 100, true)`, 'quiz_attempts: clients cannot insert passed attempts');

// Editing a published lesson does not change what learners see until it is approved again
await rpc(C, `select public.admin_save_draft('lesson', 'AQ-01', ${lit({ ...lesson, title: 'عنوان معدّل' })})`);
ok((await as('anon', null, `select data->>'title' as t from public.published_content`)).rows[0].t === 'درس اختبار', 'content: edits stay private until re-approved');
ok((await db.query(`select status from public.content_items where id = '${lid}'`)).rows[0].status === 'draft', 'content: editing a published item returns it to draft');

// Sources are required for religious text (HANDOFF §1)
const ev = { kind: 'quran', label: 'آية', text: 'نص الدليل', source: '', ref: '' };
const eid = (await rpc(C, `select public.admin_save_draft('evidence', 'AQ-01/e1', ${lit(ev)}) as id`)).rows[0].id;
await fails(C, `select public.admin_transition('ct', '${eid}', 'send')`, 'workflow: evidence without a source cannot go to review');
await rpc(C, `select public.admin_save_draft('evidence', 'AQ-01/e1', ${lit({ ...ev, source: 'مصدر موثّق', ref: '1:1', level: 1 })})`);
await rpc(C, `select public.admin_transition('ct', '${eid}', 'send')`);
ok((await rpc(B, `select public.admin_transition('ct', '${eid}', 'reject') as s`)).rows[0].s === 'rejected', 'workflow: scholar rejects');
ok((await rpc(C, `select public.admin_transition('ct', '${eid}', 'reopen') as s`)).rows[0].s === 'draft', 'workflow: content reopens a rejected item');
await rpc(C, `select public.admin_transition('ct', '${eid}', 'send')`);
ok((await rpc(B, `select public.admin_transition('ct', '${eid}', 'approve') as s`)).rows[0].s === 'published', 'workflow: one scholar approval publishes evidence');
for (const [kind, slot, data] of [
  ['quote', 'q1', { cat: 'العقيدة', text: 'نص', scholar: '', source: 'مصدر' }],
  ['adhkar', 'morning', { items: [{ id: 'm1', text: 'نص', count: 1, source: '' }] }],
  ['story', 'prophets/0', { sections: { النسب: { text: 'نص', source: '' } } }],
  ['tafsir', '1', { tafsir: 'تفسير', source: '', ayahs: { 1: 'نص' } }],
  ['audio', 'a1', { title: 'تسجيل', source: 'مصدر', audio_url: 'http://insecure' }],
]) {
  const id = (await rpc(C, `select public.admin_save_draft('${kind}', '${slot}', ${lit(data)}) as id`)).rows[0].id;
  await fails(C, `select public.admin_transition('ct', '${id}', 'send')`, `workflow: ${kind} without complete sources cannot go to review`);
}
await fails(C, `select public.admin_save_draft('tafsir', '115', ${lit({})})`, 'content: tafsir slots are limited to the 114 surahs');

// Deleting: drafts by the content team, published items only by admins
const qid = (await db.query(`select id from public.content_items where kind = 'quote'`)).rows[0].id;
await rpc(C, `select public.admin_delete_content('${qid}')`);
ok((await db.query(`select count(*)::int as n from public.content_items where kind = 'quote'`)).rows[0].n === 0, 'content: editors can discard drafts');
await fails(C, `select public.admin_delete_content('${eid}')`, 'content: editors cannot delete published items');

// ── Reports → «Notify learner» ─────────────────────────────────────────────
const rid = (await db.query(`select id from public.reports limit 1`)).rows[0].id;
await fails(C, `select public.admin_transition('rp', '${rid}', 'triage')`, 'reports: content role cannot triage');
for (const [act, want] of [['triage', 'triaged'], ['fixed', 'fixed'], ['notify', 'notified']]) {
  ok((await rpc(M, `select public.admin_transition('rp', '${rid}', '${act}') as s`)).rows[0].s === want, `reports: moderator ${act} → ${want}`);
}
const notes = (await rpc(A, `select title, report_id from public.user_notifications`)).rows;
ok(notes.length === 1 && Number(notes[0].report_id) === Number(rid), 'notifications: the reporter receives an in-app notification');
ok((await rpc(B, `select * from public.user_notifications`)).rows.length === 0, 'notifications: others cannot read it');
await rpc(A, `insert into public.user_notifications (user_id, title, body) values ('${A}', 'x', 'y')`).catch(() => {});
ok((await db.query(`select count(*)::int as n from public.user_notifications`)).rows[0].n === 1, 'notifications: clients cannot write notifications');
await rpc(A, 'select public.mark_notifications_read()');
ok((await db.query(`select read_at from public.user_notifications`)).rows[0].read_at !== null, 'notifications: the owner marks them read');

// ── Feedback inbox, reviewers, config, audit, analytics ────────────────────
const fid = (await db.query(`select id from public.feedback limit 1`)).rows[0].id;
await fails(C, `select public.admin_feedback_mark(${fid}, 'done')`, 'feedback: content role cannot triage messages');
await rpc(M, `select public.admin_feedback_mark(${fid}, 'done')`);
ok((await db.query(`select status from public.feedback`)).rows[0].status === 'done', 'feedback: moderator marks messages');
await fails(B, `select public.admin_upsert_reviewer(null, 'fiqh', 'اسم', true, null)`, 'reviewers: only admins manage the published reviewer list');
await rpc(AD, `select public.admin_upsert_reviewer(null, 'fiqh', 'اسم مراجع', true, '2026-10-01')`);
await rpc(AD, `select public.admin_upsert_reviewer(null, 'hadith', 'غير منشور', false, null)`);
ok((await as('anon', null, `select name from public.reviewers`)).rows.length === 1, 'reviewers: only published reviewers are public');
await fails(AD, `select public.admin_upsert_reviewer(null, 'unknown', 'اسم', true, null)`, 'reviewers: unknown subjects are refused');

const cfg = await as('anon', null, `select key from public.app_config order by key`);
ok(cfg.rows.map((r) => r.key).join(',') === 'curriculum,prayer', 'app_config: prayer defaults and curriculum are public');
await fails(C, `select public.admin_save_config('prayer', '{"method":"Umm al-Qura","hijriAdj":0}')`, 'app_config: only admins change defaults');
await fails(AD, `select public.admin_save_config('prayer', '{"method":"Umm al-Qura","hijriAdj":5}')`, 'app_config: Hijri adjustment is limited to ±2');
await rpc(AD, `select public.admin_save_config('curriculum', '{"stage1":{"aqeedah":2,"fiqh":1},"passPct":85}')`);
ok((await db.query(`select lessons from public.stage_requirements where stage = 1`)).rows[0].lessons === 3, 'app_config: curriculum totals drive the certificate requirement');
await rpc(AD, `update public.app_config set value = '{}'`);
ok((await db.query(`select value->>'method' as m from public.app_config where key = 'prayer'`)).rows[0].m === 'Muslim World League', 'app_config: no direct writes');

const audit = (await rpc(C, `select item, action, actor_role from public.audit_log`)).rows;
ok(audit.some((r) => r.item === 'ct:' + lid && r.action === 'review → published' && r.actor_role === 'scholar'), 'audit_log: transitions are recorded with the actor role');
await fails(AD, `insert into public.audit_log (item, action) values ('x', 'forged')`, 'audit_log: no direct inserts, even by admins');
await fails(AD, `select public.audit('x', 'forged')`, 'audit_log: the audit helper is not callable by clients');

await fails(C, 'select * from public.admin_learner_stats()', 'analytics: content role cannot read learner stats');
const ov = (await rpc(AD, 'select public.admin_overview() as o')).rows[0].o;
ok(ov.weekly.length === 7 && ov.pipeline.length === 3 && ov.avg_score === null && ov.active_learners === 0, 'overview: live counts only (no attempts yet → empty, not invented)');

// ── Least-privilege EXECUTE (hardening migration) ──────────────────────────
for (const fn of [`public.admin_set_staff('a@test.local', 'admin')`, `public.admin_save_draft('quote', 'x', '{}')`, `public.has_perm('manage_roles')`, 'public.admin_content()', `public.require_perm('view_queues')`, `public.cms_check('quote', 'x', '{}', true)`]) {
  await failsAnon(`select ${fn}`, `execute: signed-out clients cannot call ${fn.split('(')[0]}`);
}
await fails(A, `select public.require_perm('view_queues')`, 'execute: internal helpers are not callable by signed-in users');
await fails(A, 'select * from public.admin_content()', 'content: non-staff cannot list drafts');
ok((await rpc(C, 'select count(*)::int as n from public.admin_content()')).rows[0].n >= 2, 'content: staff read full rows through admin_content()');

// ── Certificates & account deletion ────────────────────────────────────────
await db.exec(`insert into public.certificates (code, user_id, stage, name) values ('BSR-1-ABCD-EFGH', '${A}', 1, 'أحمد')`);
ok((await as('authenticated', B, 'select * from public.certificates')).rows.length === 0, 'certificates: users cannot read others’ certificates');
await db.exec(`delete from auth.users where id = '${A}'`);
const gone = await db.query(`select (select count(*) from public.user_state where user_id = '${A}')::int + (select count(*) from public.certificates where user_id = '${A}')::int + (select count(*) from public.user_notifications where user_id = '${A}')::int as n`);
ok(gone.rows[0].n === 0, 'deleting a user cascades to their data');

console.log(failures ? `\n${failures} check(s) failed` : '\nall backend checks passed');
process.exit(failures ? 1 : 0);

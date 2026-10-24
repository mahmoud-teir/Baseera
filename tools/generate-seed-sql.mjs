import { DEFAULT_VOCAB } from '../src/data/defaults.ts';
import fs from 'fs';

let sql = `-- =============================================================================
-- Baseerah Quran Vocabulary Migration & Seed
-- Run this script in the Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/yxqdquynlgfbxyultsux/sql)
-- =============================================================================

`;

sql += fs.readFileSync('backend/supabase/migrations/20261025000000_quran_vocab.sql', 'utf8');
sql += '\n\n-- ── Insert & Publish Initial Quran Vocabulary ────────────────────────────────\n\n';

for (const item of DEFAULT_VOCAB) {
  const data = JSON.stringify(item).replace(/'/g, "''");
  const title = item.word.replace(/'/g, "''");
  const cat = item.category.replace(/'/g, "''");
  const src = (item.ayahs[0]?.source || 'القرآن الكريم وأمهات التفاسير').replace(/'/g, "''");

  sql += `insert into public.content_items (kind, slot, title, category, source, data, published_data, published_at, status, approver_names)
values ('vocab', '${item.id}', '${title}', '${cat}', '${src}', '${data}'::jsonb, '${data}'::jsonb, now(), 'published', array['هيئة التدقيق العلمي'])
on conflict (kind, slot) do update set
  title = excluded.title,
  category = excluded.category,
  source = excluded.source,
  data = excluded.data,
  published_data = excluded.published_data,
  published_at = excluded.published_at,
  status = 'published',
  approver_names = excluded.approver_names;\n\n`;
}

fs.writeFileSync('tools/seed-vocab.sql', sql, 'utf8');
console.log('Generated tools/seed-vocab.sql successfully.');

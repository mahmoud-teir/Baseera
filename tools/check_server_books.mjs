import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
let anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  try {
    const envFile = readFileSync(resolve('.env.local'), 'utf8');
    for (const line of envFile.split('\n')) {
      const [k, v] = line.split('=');
      if (k?.trim() === 'EXPO_PUBLIC_SUPABASE_URL') url = v?.trim();
      if (k?.trim() === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') anonKey = v?.trim();
    }
  } catch {}
}

const supabase = createClient(url, anonKey);

async function listAll() {
  const { data, error } = await supabase
    .from('published_content')
    .select('slot, kind, data')
    .eq('kind', 'book');

  if (error) {
    console.error('Error fetching published_content:', error);
    return;
  }

  console.log(`=== LIVE BOOKS ON SUPABASE PRODUCTION (${data.length} items) ===\n`);
  data.forEach((item, i) => {
    const d = item.data;
    const chapters = d.chapters ? d.chapters.length : 0;
    let pars = 0;
    let chars = 0;
    if (d.chapters) {
      d.chapters.forEach(c => {
        pars += (c.paragraphs || []).length;
        chars += (c.paragraphs || []).reduce((a, b) => a + b.length, 0);
      });
    }
    console.log(`${i + 1}. [${item.slot}] «${d.title || item.slot}»`);
    console.log(`   Author: ${d.author || 'N/A'}`);
    console.log(`   Chapters: ${chapters} | Paragraphs: ${pars} | Size: ${chars.toLocaleString()} chars`);
    console.log(`   Updated: ${item.updated_at}`);
    console.log('----------------------------------------------------');
  });
}

listAll();

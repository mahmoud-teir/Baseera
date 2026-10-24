async function run() {
  const res = await fetch('https://aladhan.com/download-adhans');
  const html = await res.text();
  for (const code of ['a1.mp3', 'a2.mp3', 'a3.mp3', 'a4.mp3', 'a7.mp3', 'a9.mp3', 'a11-mansour-al-zahrani.mp3']) {
    const idx = html.indexOf(code);
    if (idx !== -1) {
      const slice = html.slice(Math.max(0, idx - 200), idx + 200);
      const textOnly = slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(code, '===>', textOnly);
    }
  }
}
run().catch(console.error);

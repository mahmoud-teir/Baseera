import fs from 'node:fs';

const path = 'src/services/tafsir.ts';
let s = fs.readFileSync(path, 'utf8');

const oldHook = `/** هوك React للحصول على تفسير آية معينة مع التبديل السريع والكاش */
export function useAyahTafsir(
  surah: number,
  ayah: number,
  tafsirQuery?: string | null
) {
  const tafsirInfo = getTafsirInfo(tafsirQuery);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    setAttempt((c) => c + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);

    loadSurahTafsir(tafsirInfo.slug, surah)
      .then((map) => {
        if (!alive) return;
        if (map && map[ayah]) {
          setText(map[ayah]);
          setError(false);
        } else if (map && !map[ayah]) {
          // بعض الآيات قد تتشارك التفسير مع الآية السابقة
          const prevAyah = ayah > 1 ? map[ayah - 1] : null;
          setText(prevAyah ?? null);
          setError(!prevAyah);
        } else {
          setText(null);
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setText(null);
        setError(true);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tafsirInfo.slug, surah, ayah, attempt]);

  return { text, loading, error, retry, tafsirInfo };
}`;

const newHook = `/** هوك React للحصول على تفسير آية معينة مع التبديل السريع والكاش */
export function useAyahTafsir(
  surah: number,
  ayah: number,
  tafsirQuery?: string | null
) {
  const tafsirInfo = getTafsirInfo(tafsirQuery);
  const cacheKey = \`\${tafsirInfo.slug}:\${surah}\`;
  const cached = MEM_CACHE[cacheKey];

  const [data, setData] = useState<{
    key: string;
    map: Record<number, string> | null;
    loading: boolean;
    error: boolean;
  }>(() => ({
    key: cacheKey,
    map: cached ?? null,
    loading: !cached,
    error: false,
  }));
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((c) => c + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    if (MEM_CACHE[cacheKey]) {
      setData({ key: cacheKey, map: MEM_CACHE[cacheKey], loading: false, error: false });
      return;
    }

    loadSurahTafsir(tafsirInfo.slug, surah)
      .then((map) => {
        if (!alive) return;
        setData({ key: cacheKey, map, loading: false, error: !map });
      })
      .catch(() => {
        if (!alive) return;
        setData({ key: cacheKey, map: null, loading: false, error: true });
      });

    return () => {
      alive = false;
    };
  }, [cacheKey, tafsirInfo.slug, surah, attempt]);

  const map = data.key === cacheKey ? data.map : cached ?? null;
  const loading = data.key === cacheKey ? data.loading : !map;
  const error = data.key === cacheKey ? data.error : false;
  const text = map ? (map[ayah] ?? (ayah > 1 ? map[ayah - 1] ?? null : null)) : null;

  return { text, loading, error, retry, tafsirInfo };
}`;

const norm = (str) => str.replace(/\r?\n/g, '\n');
const isCRLF = s.includes('\r\n');
const toFileEnding = (str) => isCRLF ? str.replace(/\n/g, '\r\n') : str.replace(/\r\n/g, '\n');

s = toFileEnding(norm(s).replace(norm(oldHook), norm(newHook)));
fs.writeFileSync(path, s);
console.log('Fixed useAyahTafsir without setState in effect!');

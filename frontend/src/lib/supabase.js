import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error(
    '⚠️  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    '   Copy .env.example → .env and fill in your Supabase credentials.',
  );
}

export const supabase = createClient(url ?? '', anon ?? '', {
  db: { schema: 'public' },
  auth: { persistSession: true, autoRefreshToken: true },
});

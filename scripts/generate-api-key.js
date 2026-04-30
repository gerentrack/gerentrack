/**
 * Gera uma API key e insere o hash no Supabase.
 *
 * Uso:
 *   node scripts/generate-api-key.js "Nome do consumidor" "email@exemplo.com"
 *
 * A chave é exibida apenas uma vez — copie e guarde.
 * Requer variáveis SUPABASE_URL e SUPABASE_SECRET_KEY no .env
 */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Carregar .env manualmente
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  });
} catch (e) {
  console.error('Não foi possível ler .env:', e.message);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SECRET_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const name = process.argv[2];
  const email = process.argv[3] || null;

  if (!name) {
    console.error('Uso: node scripts/generate-api-key.js "Nome" ["email"]');
    process.exit(1);
  }

  const key = `gt_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  const { error } = await supabase
    .from('api_keys')
    .insert({ key_hash: hash, name, email });

  if (error) {
    console.error('Erro ao inserir:', error.message);
    process.exit(1);
  }

  console.log('\n=== API Key gerada com sucesso ===');
  console.log(`Nome:  ${name}`);
  console.log(`Email: ${email || '(nenhum)'}`);
  console.log(`Key:   ${key}`);
  console.log('\nGuarde esta chave — ela não será exibida novamente.');
}

main();

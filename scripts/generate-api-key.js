/**
 * Gera uma API key e insere o hash no Supabase.
 *
 * Uso:
 *   node scripts/generate-api-key.js "Nome do consumidor" "email@exemplo.com"
 *
 * A chave é exibida apenas uma vez — copie e guarde.
 * Requer variáveis SUPABASE_URL e SUPABASE_SECRET_KEY no .env
 */
require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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

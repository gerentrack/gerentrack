const crypto = require('crypto');
const { supabase } = require('../../_lib/supabase');

/**
 * Valida API key via header X-API-Key ou query ?api_key=
 * Retorna o registro da key ou null se inválida.
 */
async function validarApiKey(req) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return null;

  const hash = crypto.createHash('sha256').update(key).digest('hex');

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, rate_limit_per_min, active')
    .eq('key_hash', hash)
    .single();

  if (error || !data || !data.active) return null;

  // Atualizar last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})
    .catch(() => {});

  return data;
}

module.exports = { validarApiKey };

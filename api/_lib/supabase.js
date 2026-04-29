const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('SUPABASE_URL ou SUPABASE_SECRET_KEY não definidas');
}

// Usa a secret key (service_role) para acesso completo server-side
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SECRET_KEY || '', {
  auth: { persistSession: false },
});

module.exports = { supabase };

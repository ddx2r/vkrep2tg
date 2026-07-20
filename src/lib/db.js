
// src/lib/db.js (CommonJS)
// Минимальный Supabase-клиент для серверного использования с ключом Service Role.
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require('../config');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

module.exports = { supabase };

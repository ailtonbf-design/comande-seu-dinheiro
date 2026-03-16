import { createClient } from '@supabase/supabase-js';

// Substitua com os dados do seu painel do Supabase (Project Settings > API)
const supabaseUrl = 'https://ihwgkmhzdzwtodqqmqfm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Z_XW6irjdyQyGNU5U26eFw_SttYRhQZ';

// Cria a conexão (o "cabo" ligado ao motor)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

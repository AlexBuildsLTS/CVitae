import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Best Practice: Fallback to empty string to prevent crashes during dev if env is missing
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined, 
    autoRefreshToken: true,
    persistSession: false, // lightweight for visitors
    detectSessionInUrl: false,
  },
});
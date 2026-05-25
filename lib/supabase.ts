import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  // Add timeout configuration for network requests
  global: {
    headers: {
      "X-Client-Info": "supabase-js/2.95.3",
    },
  },
  // Optional: Configure realtime settings
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
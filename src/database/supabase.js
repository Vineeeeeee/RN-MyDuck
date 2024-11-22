import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://iyidznskrlgpywnocuoc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aWR6bnNrcmxncHl3bm9jdW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDIzNTEsImV4cCI6MjA0NjI3ODM1MX0.OVicCYZU4JJuoLdhHUM_JMA3XJ9sMvcM8exZdKcYkwo"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
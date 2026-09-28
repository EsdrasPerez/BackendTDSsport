import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtxxcundordklfclweuk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eHhjdW5kb3Jka2xmY2x3ZXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzM5NzcsImV4cCI6MjEwNTc0OTk3N30.kD-ABFS93-0ZwNNjhu-iVOtWNSea-ijkFGwIN_dgWdg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bgzjcnbjrevsabtyvjgg.supabase.co'
const supabaseAnonKey = 'sb_publishable_3nxbEt6Ez8yh86vqkZ1EKQ_1mOOrNeQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

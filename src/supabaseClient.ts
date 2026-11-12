import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qbzsmucwxscljstkzxzw.supabase.co'
const supabaseAnonKey = 'sb_publishable_ZqpC_q7Rv5fEVTo-M4Apkg_02_6o86j'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
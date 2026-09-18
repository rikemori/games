import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fghtbrfjmlalxkecsekg.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rBOWhuusiuVa1QFumT05PQ_04LFZjGE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lnaefjarrpvzxgvlmlyd.supabase.co";
const supabaseKey = "sb_publishable_GamXVLzu1UuuRhwfrpG3aQ_sAe9VBG-";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
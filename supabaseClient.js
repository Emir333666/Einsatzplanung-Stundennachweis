// Supabase-Verbindung – diese Werte sind öffentlich und dürfen hier stehen.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbrvsfyzgiixwoheibib.supabase.co";
const SUPABASE_KEY = "sb_publishable_kiS0TVGWy3djN2X63m31MA_FTIzJJzm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

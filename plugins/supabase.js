import { createClient } from "@supabase/supabase-js";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

export default ({ app }, inject) => {
  inject("db", supabase);
};

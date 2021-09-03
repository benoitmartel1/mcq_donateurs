import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://edmzyjbiamagocfjwrlw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDYwOTIxOSwiZXhwIjoxOTQ2MTg1MjE5fQ.KsNNJzFD2hm0hZ31hf_x6X1MjRklEgqp_Oe8fDkLuYk"
);

export default ({ app }, inject) => {
  inject("db", supabase);
};

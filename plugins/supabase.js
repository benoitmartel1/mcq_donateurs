import { createClient } from "@supabase/supabase-js";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjMwNjA5MjE5LCJleHAiOjE5NDYxODUyMTl9.uM0xQ_JGL1mB-m8XK9WkJYOCo2qOdga8VNDJVX5vuFs";

const SUPABASE_URL = "https://edmzyjbiamagocfjwrlw.supabase.co";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

export default ({ app }, inject) => {
  inject("db", supabase);
};

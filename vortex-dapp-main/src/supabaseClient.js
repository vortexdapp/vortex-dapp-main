// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables
const supabaseUrl = "https://mivxbkbqlpwfkrlgcvqt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdnhia2JxbHB3ZmtybGdjdnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNzkxMjMsImV4cCI6MjA0NDc1NTEyM30.LuOK6Z0p4I3RAS-_HprsoHcsRZaXc-sW2Em9A_Mxg5I";

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
}

// Create a single supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables
const supabaseUrl = "https://yqlzxpdtjkhqjiddbbko.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbHp4cGR0amtocWppZGRiYmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0MjMzNzMsImV4cCI6MjA0Mzk5OTM3M30.pIj-0AKNry6hbbK5bi4jvX1JTuMo1BdMv_crVGci15g";

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
}

// Create a single supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

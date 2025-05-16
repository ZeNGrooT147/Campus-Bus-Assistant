
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ExtendedDatabase } from '@/types/supabaseTypes';

const SUPABASE_URL = "https://vmuloeaaettksqpzwrcu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdWxvZWFhZXR0a3NxcHp3cmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTU0MDcsImV4cCI6MjA1ODUzMTQwN30.PDlMBMwm2m4JoPDudXzouVk79PkANLxS0Ql-VTKTpO4";

// Define Profile type to match our database schema
export type Profile = {
  id: string;
  name: string;
  role: 'student' | 'driver' | 'coordinator' | 'admin';
  email?: string;
  usn?: string;
  phone?: string;
  region?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

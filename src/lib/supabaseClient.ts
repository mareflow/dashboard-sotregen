import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qxpreiugsyykkpyoeumx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4cHJlaXVnc3l5a2tweW9ldW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTg3NDMsImV4cCI6MjA5ODM5NDc0M30.zt_Dp_OKJXrrnKQUeo3EBZu_jC8IAAqi4zsFeSbhPmw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


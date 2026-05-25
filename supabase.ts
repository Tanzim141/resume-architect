import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://sjyroliksgdivpacfhpz.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeXJvbGlrc2dkaXZwYWNmaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjQ2MDMsImV4cCI6MjA5NTA0MDYwM30.wfBL66nm8jn6Q5tHLDwbdK6OOE6wbqnMXnGC3ZOWzpI';

export const supabase = createClient(supabaseUrl, supabaseKey);

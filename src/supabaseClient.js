import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://weafxpgxmhigpnnkkvrh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYWZ4cGd4bWhpZ3BubmtrdnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzMwMDEsImV4cCI6MjA5MTIwOTAwMX0.Z97TRxHK3We1lQhs_T-5YEBWjYu8LfLfi-rgXzb7ZIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

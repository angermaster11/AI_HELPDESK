// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjpgxqkmvnuiqenmzflu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGd4cWttdm51aXFlbm16Zmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDA0MjMsImV4cCI6MjA2NzMxNjQyM30._PG3WGbVrtmC7gUjMcIUhVqQ-tVIphNITPShQ3KbV3E';

export const supabase = createClient(supabaseUrl, supabaseKey);
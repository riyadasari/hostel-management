import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- TEST COMMENT JOIN ---");

    // Attempt 1: explicitly using the column name as hint (already tried, but verifying standalone)
    console.log("Attempt 1: profiles!user_id");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select(`id, profiles!user_id(name)`)
            .limit(1);
        if (error) console.log("Att 1 Error:", error.message);
        else console.log("Att 1 Success! data:", JSON.stringify(data));
    } catch (e) { console.log(e); }

    // Attempt 2: using standard postgres constraint naming
    console.log("\nAttempt 2: profiles!issue_comments_user_id_fkey");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select(`id, profiles!issue_comments_user_id_fkey(name)`)
            .limit(1);
        if (error) console.log("Att 2 Error:", error.message);
        else console.log("Att 2 Success! data:", JSON.stringify(data));
    } catch (e) { console.log(e); }

    // Attempt 3: No hint (should detect one-to-many? but user_id is the FK)
    console.log("\nAttempt 3: profiles (no hint)");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select(`id, profiles(name)`)
            .limit(1);
        if (error) console.log("Att 3 Error:", error.message);
        else console.log("Att 3 Success! data:", JSON.stringify(data));
    } catch (e) { console.log(e); }
}

runConfig();

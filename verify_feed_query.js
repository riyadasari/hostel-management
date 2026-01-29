import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- TEST 1: Issues -> Profiles (Hint: created_by) ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles:profiles!created_by(name)')
            .limit(1);

        if (error) console.log("Test 1 Error:", error.message);
        else console.log("Test 1 Success! Profile Name:", data[0]?.profiles?.name);
    } catch (e) { console.log("Test 1 Exception:", e.message); }

    console.log("\n--- TEST 2: Issues -> Profiles (No Hint) ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles(name)')
            .limit(1);

        if (error) console.log("Test 2 Error:", error.message);
        else console.log("Test 2 Success! Profile Name:", data[0]?.profiles?.name);
    } catch (e) { console.log("Test 2 Exception:", e.message); }

    console.log("\n--- TEST 3: Issues -> Comments -> Profiles (Hint: user_id) ---");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select('id, profiles:profiles!user_id(name)')
            .limit(1);

        if (error) console.log("Test 3 Error:", error.message);
        else console.log("Test 3 Success! Profile Name:", data[0]?.profiles?.name);
    } catch (e) { console.log("Test 3 Exception:", e.message); }

    console.log("\n--- TEST 4: Issues -> Comments -> Profiles (No Hint) ---");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select('id, profiles(name)')
            .limit(1);

        if (error) console.log("Test 4 Error:", error.message);
        else console.log("Test 4 Success! Profile Name:", data[0]?.profiles?.name);
    } catch (e) { console.log("Test 4 Exception:", e.message); }
}

runConfig();

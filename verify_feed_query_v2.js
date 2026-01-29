import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- START VERIFICATION ---");

    // TEST 1: Issues -> Profiles (Hint: created_by)
    console.log("\nTEST 1: Checking 'issues -> profiles' (Hint: created_by)...");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select(`
                id,
                created_at,
                profiles:profiles!created_by(name)
            `)
            .limit(1);

        if (error) {
            console.error("FAILED - Test 1 Error:", error.message);
        } else {
            console.log("SUCCESS - Test 1");
            if (data.length > 0) {
                console.log("Sample Data:", JSON.stringify(data[0].profiles));
            } else {
                console.log("No issues found.");
            }
        }
    } catch (e) {
        console.error("EXCEPTION - Test 1:", e.message);
    }

    // TEST 2: Issue Comments -> Profiles (No Hint)
    console.log("\nTEST 2: Checking 'issue_comments -> profiles' (No Hint)...");
    try {
        // First get a comment ID to be safe, or just limit 1
        const { data, error } = await supabase
            .from('issue_comments')
            .select(`
                id,
                profiles(name)
            `)
            .limit(1);

        if (error) {
            console.error("FAILED - Test 2 Error:", error.message);
        } else {
            console.log("SUCCESS - Test 2");
            if (data.length > 0) {
                console.log("Sample Data:", JSON.stringify(data[0].profiles));
            } else {
                console.log("No comments found.");
            }
        }
    } catch (e) {
        console.error("EXCEPTION - Test 2:", e.message);
    }

    // TEST 3: Original Query (Full)
    console.log("\nTEST 3: Checking Full Original Query...");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select(`
                *,
                profiles:profiles!created_by (name),
                issue_likes (user_id),
                issue_comments (
                    id,
                    comment,
                    created_at,
                    user_id,
                    profiles:profiles!user_id (name)
                )
            `)
            .limit(1);

        if (error) {
            console.error("FAILED - Test 3 Error:", error.message);
            // If it failed, details might be in error code
            console.error("Error Code:", error.code);
            console.error("Error Hint:", error.hint);
        } else {
            console.log("SUCCESS - Test 3");
        }

    } catch (e) {
        console.error("EXCEPTION - Test 3:", e.message);
    }
}

runConfig();

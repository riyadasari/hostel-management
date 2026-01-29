import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- FINAL VERIFICATION: Community Feed Query ---");
    try {
        const { data: issuesData, error } = await supabase
            .from('issues')
            .select(`
                *,
                profiles:profiles!created_by (name),
                issue_likes (user_id),
                issue_comments (
                    id,
                    comment,
                    created_at,
                    user_id
                )
            `)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("FAILED - Query Error:", error);
        } else {
            console.log("SUCCESS - Query Executed.");
            console.log("Count:", issuesData.length);
            if (issuesData.length > 0) {
                issuesData.forEach((issue, index) => {
                    console.log(`[${index}] Issue ID: ${issue.id}`);
                    console.log(`    Author: ${JSON.stringify(issue.profiles)}`);
                    console.log(`    Comments: ${issue.issue_comments.length}`);
                });

                const first = issuesData[0];
                if (first.profiles && first.profiles.name) {
                    console.log("\nVERIFICATION RESULT: PASSED. Author Name is present.");
                } else {
                    console.log("\nVERIFICATION RESULT: WARNING. Author Name is null (might be expected if profile deleted, but structure is valid).");
                }
            } else {
                console.log("No issues found to verify.");
            }
        }
    } catch (e) {
        console.error("Execution Error:", e);
    }
}

runConfig();

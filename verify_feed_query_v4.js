import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- TEST X: Hint 'issues_created_by_fkey' ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles:profiles!issues_created_by_fkey(name)')
            .limit(1);

        if (error) console.log("Test X Error:", error.message);
        else console.log("Test X Success! Profile:", JSON.stringify(data[0].profiles));
    } catch (e) { console.log("Test X Ex:", e.message); }

    console.log("\n--- TEST Y: Hint 'public_issues_created_by_fkey' ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles:profiles!public_issues_created_by_fkey(name)')
            .limit(1);

        if (error) console.log("Test Y Error:", error.message);
        else console.log("Test Y Success! Profile:", JSON.stringify(data[0].profiles));
    } catch (e) { console.log("Test Y Ex:", e.message); }

    console.log("\n--- TEST Z: Hint 'created_by' (Column Name) CLEAN CHECK ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles:profiles!created_by(name)')
            .limit(1);

        if (error) console.log("Test Z Error:", error.message);
        else console.log("Test Z Success! Profile:", JSON.stringify(data[0].profiles));
    } catch (e) { console.log("Test Z Ex:", e.message); }
}

runConfig();

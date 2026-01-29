import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runConfig() {
    console.log("--- TEST A: Issues -> Profiles (NO HINT) ---");
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, profiles(name)')
            .limit(1);

        if (error) {
            console.log("TEST A FAILED:", error.message);
            if (error.hint) console.log("Hint:", error.hint);
            if (error.details) console.log("Details:", error.details);
        } else {
            console.log("TEST A SUCCESS!");
            if (data.length > 0) console.log("Data profiles:", JSON.stringify(data[0].profiles));
        }
    } catch (e) { console.log("TEST A EXCEPTION:", e.message); }

    await sleep(500);

    console.log("\n--- TEST B: Issue Comments -> Profiles (NO HINT) ---");
    try {
        const { data, error } = await supabase
            .from('issue_comments')
            .select('id, profiles(name)')
            .limit(1);

        if (error) {
            console.log("TEST B FAILED:", error.message);
            if (error.hint) console.log("Hint:", error.hint);
        } else {
            console.log("TEST B SUCCESS!");
            if (data.length > 0) console.log("Data profiles:", JSON.stringify(data[0].profiles));
        }
    } catch (e) { console.log("TEST B EXCEPTION:", e.message); }
}

runConfig();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- SEARCHING FOR VALID DATA TO PROVE FIX ---");

    // 1. Get a valid profile ID
    const { data: profiles } = await supabase.from('profiles').select('id, name').limit(5);
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found at all!");
        return;
    }

    const validIds = profiles.map(p => p.id);
    console.log(`Found ${validIds.length} profiles. Checking for their issues...`);

    // 2. Check if any issue exists for these profiles
    const { data: issues, error } = await supabase
        .from('issues')
        .select(`
            id, 
            created_by,
            profiles:profiles!created_by(name)
        `)
        .in('created_by', validIds)
        .limit(1);

    if (error) {
        console.log("Query Error:", error);
    } else if (issues.length > 0) {
        console.log("FOUND VALID MATCH!");
        console.log("Issue ID:", issues[0].id);
        console.log("Profile Name from JOIN:", issues[0].profiles?.name);
    } else {
        console.log("No issues found for the first 5 profiles. You might want to create a fresh issue in the app.");
    }
}

runConfig();

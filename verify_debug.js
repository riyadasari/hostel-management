import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fzvsblqnqxuuupqnygnf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNibHFucXh1dXVwcW55Z25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDkzODYsImV4cCI6MjA4NDkyNTM4Nn0.rtbL-K2gxj_eaMwTQvvcihIchKh27PT-Ezd6wBx9aLM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConfig() {
    console.log("--- DEBUG VERIFICATION ---");
    try {
        const { data: issuesData, error } = await supabase
            .from('issues')
            .select(`
                id,
                created_by,
                profiles:profiles!created_by (id, name)
            `)
            .eq('visibility', 'public')
            .limit(3);

        if (error) {
            console.error("Query Error:", error);
            return;
        }

        console.log(`Fetched ${issuesData.length} issues.`);

        for (const issue of issuesData) {
            console.log(`\nIssue ID: ${issue.id}`);
            console.log(`Created By (UUID): ${issue.created_by}`);
            console.log(`Profile Join Result: ${JSON.stringify(issue.profiles)}`);

            if (issue.created_by && !issue.profiles) {
                console.log(`    -> Checking if profile ${issue.created_by} exists explicitly...`);
                const { data: profileCheck, error: pError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('id', issue.created_by)
                    .single();

                if (pError) {
                    console.log(`    -> Profile fetch error: ${pError.message}`);
                } else if (profileCheck) {
                    console.log(`    -> Profile EXISTS! Name: ${profileCheck.name} -- JOIN SHOULD HAVE WORKED.`);
                } else {
                    console.log(`    -> Profile does NOT exist (Orphaned Record).`);
                }
            }
        }

    } catch (e) {
        console.error("Execution Error:", e);
    }
}

runConfig();

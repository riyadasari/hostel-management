import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // STRICTLY session loading
    const [profileLoading, setProfileLoading] = useState(false);

    // Non-blocking profile fetch
    const fetchProfile = async (userId) => {
        if (!userId) return;
        setProfileLoading(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Auto-create profile if missing
                if (error.code === 'PGRST116') {
                    console.warn("Profile missing. Creating default...");
                    // Try to get email from user state if possible, though user state might be stale here.
                    // Better to rely on what we have or generic fallback.
                    // Actually, we can fetch user object again or rely on the fact that we have an active session.
                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                    const newProfile = {
                        id: userId,
                        name: currentUser?.email?.split('@')[0] || 'Student',
                        email: currentUser?.email,
                        role: 'student'
                    };

                    const { data: created, error: createError } = await supabase
                        .from('profiles')
                        .insert([newProfile])
                        .select()
                        .single();

                    if (!createError) {
                        setProfile(created);
                    } else {
                        console.error("Auto-create profile failed:", createError);
                        // Fallback purely local
                        setProfile({ id: userId, name: 'Student', role: 'student' });
                    }
                } else {
                    console.error("Profile fetch error:", error);
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error("Profile fetch exception:", err);
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        // 1. Initial Session Check (Blocking)
        const initializeAuth = async () => {
            // Check if we expect a session from LocalStorage
            // This heuristic prevents the "flash logout" by blocking UI if a token likely exists
            const hasSupabaseToken = Object.keys(localStorage).some(key => key.startsWith('sb-'));

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && mounted) {
                    setUser(session.user);
                    fetchProfile(session.user.id);
                } else if (hasSupabaseToken) {
                    console.log("No session found in getSession, but LocalStorage token exists. Waiting for auto-restore...");
                }
            } catch (error) {
                console.error("Auth init failed:", error);
            } finally {
                // If we found a session, unblock immediately.
                // If we didn't find a session BUT we have a token in storage, proactively retry getSession
                // because SimpleProtectedRoute proved the session might be there, just lazy loading.
                if (mounted && !user && hasSupabaseToken) {
                    console.log("AuthContext: Starting active session polling...");
                    let attempts = 0;
                    const maxAttempts = 10; // 2 seconds (10 * 200ms)

                    const pollInterval = setInterval(async () => {
                        attempts++;
                        if (!mounted) {
                            clearInterval(pollInterval);
                            return;
                        }

                        const { data } = await supabase.auth.getSession();
                        if (data?.session?.user) {
                            console.log("AuthContext: Polling found session!");
                            setUser(data.session.user);
                            setLoading(false);
                            fetchProfile(data.session.user.id);
                            clearInterval(pollInterval);
                        } else if (attempts >= maxAttempts) {
                            console.warn("AuthContext: Polling timed out. No session.");
                            setLoading(false); // Give up
                            clearInterval(pollInterval);
                        }
                    }, 200);
                } else if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // 2. Auth Listener (Single Source of Truth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // console.log("Auth Event:", event);


            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                const sessionUser = session?.user;
                if (sessionUser) {
                    setUser(sessionUser);
                    setLoading(false); // OPTIMIZATION: Unblock UI immediately if session restores!

                    // Only fetch profile if not present or user changed
                    if (sessionUser.id !== user?.id) {
                        setProfile(null);
                        fetchProfile(sessionUser.id);
                    } else if (!profile && !profileLoading) {
                        fetchProfile(sessionUser.id);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setProfileLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array

    const signOut = async () => {
        await supabase.auth.signOut();
        // State update handled by onAuthStateChange('SIGNED_OUT')
    };

    const value = {
        user,
        profile,
        loading,
        profileLoading,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

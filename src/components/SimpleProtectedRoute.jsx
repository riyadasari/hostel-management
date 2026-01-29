import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SimpleProtectedRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            // 1. Check LocalStorage heuristic first (instant fail-safe)
            const hasLocalToken = Object.keys(localStorage).some(k => k.startsWith('sb-'));

            try {
                // 2. Ask Supabase for session
                const { data, error } = await supabase.auth.getSession();

                if (mounted) {
                    if (data?.session) {
                        setSession(data.session);
                        setIsLoading(false);
                    } else if (hasLocalToken) {
                        // 3. Fallback: If local token exists but getSession is null, wait for auto-restore
                        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                                if (session && mounted) {
                                    setSession(session);
                                    setIsLoading(false);
                                    subscription.unsubscribe();
                                }
                            }
                        });

                        // Timeout fallback to avoid infinite load
                        setTimeout(() => {
                            if (mounted && isLoading) {
                                setIsLoading(false);
                            }
                        }, 2000);
                    } else {
                        // Truly guest
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                if (mounted) setIsLoading(false);
            }
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400 text-xs">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default SimpleProtectedRoute;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Authenticate
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // 2. Fetch profile with timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Network timeout: Could not fetch profile data.")), 7000)
                );

                const profilePromise = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                try {
                    const { data: profile, error: profileError } = await profilePromise;

                    if (profileError) {
                        // Swallow abort/timeout errors safely
                        if (profileError.message && (profileError.message.includes("aborted") || profileError.message.includes("signal"))) {
                            console.warn("Swallowing abort error during login redirect.");
                        } else {
                            console.error("Error fetching profile for redirect:", profileError);
                        }
                        // Fallback logic
                        navigate('/');
                    } else if (profile?.role === 'student') {
                        navigate('/student');
                    } else if (profile?.role === 'staff') {
                        navigate('/staff/dashboard');
                    } else if (profile?.role === 'management') {
                        navigate('/management/overview');
                    } else {
                        navigate('/');
                    }
                } catch (fetchErr) {
                    console.error("Profile fetch failed:", fetchErr);
                    navigate('/');
                }
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.message || "Invalid login credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Enter your details to access your account."
        >
            <form className="space-y-5" onSubmit={handleLogin}>
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <a href="#" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                            Forgot Password?
                        </a>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        required
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </div>
            </form>


        </AuthLayout>
    );
};

export default Login;
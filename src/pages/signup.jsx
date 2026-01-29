import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'student', // Default role
        hostel: '',
        block: '',
        room: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error on change
    };

    const handleNext = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (authData?.user) {
                // 2. Insert Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id,
                            name: formData.fullName,
                            role: formData.role,
                            hostel: formData.hostel,
                            block: formData.block,
                            room: formData.role === 'student' ? formData.room : null,
                        }
                    ]);

                if (profileError) {
                    // Optional: If profile fails, might want to clean up auth user or show specific error
                    // For now, throwing to catch block
                    throw new Error("Failed to create profile: " + profileError.message);
                }

                // Success
                alert("Account created successfully! Please log in.");
                navigate('/login');
            }

        } catch (err) {
            console.error("Signup Error:", err);
            setError(err.message || "An unexpected error occurred during signup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? "Create Account" : "Complete Profile"}
            subtitle={step === 1 ? "Join HostelFix to start reporting issues." : "Tell us a bit more about you."}
        >
            <form className="space-y-4" onSubmit={step === 1 ? handleNext : handleSubmit}>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                {/* STEP 1: ACCOUNT CREATION */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="student@university.edu"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Continue
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PROFILE COMPLETION */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-white"
                            >
                                <option value="student">Student</option>
                                <option value="staff">Warden / Staff</option>
                                <option value="management">Management</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                                <input
                                    name="hostel"
                                    type="text"
                                    value={formData.hostel}
                                    onChange={handleChange}
                                    placeholder="e.g. Kaveri"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Block / Wing</label>
                                <input
                                    name="block"
                                    type="text"
                                    value={formData.block}
                                    onChange={handleChange}
                                    placeholder="e.g. A"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                    required
                                />
                            </div>
                        </div>

                        {/* Room Number - Only for Students */}
                        {formData.role === 'student' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                <input
                                    name="room"
                                    type="text"
                                    value={formData.room}
                                    onChange={handleChange}
                                    placeholder="e.g. 304"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                    required
                                />
                            </div>
                        )}

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creating Account...' : 'Complete Signup'}
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="text-sm text-gray-500 font-medium hover:text-gray-800 transition-colors"
                            >
                                Back to Account Details
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </AuthLayout>
    );
};

export default Signup;

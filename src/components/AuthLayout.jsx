import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
    const location = useLocation();
    const isLogin = location.pathname === '/login';

    return (
        <div className="flex h-screen w-full font-sans bg-gray-50 overflow-hidden">

            {/* LEFT PANEL */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white overflow-hidden">

                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-gray-900 to-gray-900" />
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-red-600/20 via-transparent to-transparent" />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" />
                </div>

                {/* CENTERED CONTENT WRAPPER */}
                <div className="relative z-10 flex flex-col justify-center px-12 max-w-xl mx-auto h-full gap-10">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center font-bold text-xl">
                            H
                        </div>
                        <span className="text-xl font-bold">HostelFix</span>
                    </Link>

                    {/* Text */}
                    <div>
                        <div className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                                Student & Management Portal
                            </span>
                        </div>

                        <h1 className="text-5xl font-extrabold leading-tight mb-5">
                            Manage your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                Hostel Life
                            </span>
                            <br /> efficiently.
                        </h1>

                        <p className="text-gray-400 text-lg leading-relaxed">
                            Join the platform where students and wardens collaborate to fix
                            issues faster. Transparent, real-time tracking for a better living
                            experience.
                        </p>
                    </div>


                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6">

                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 px-8 py-7">

                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-6 p-1 bg-gray-100 rounded-xl">
                        <Link
                            to="/login"
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg text-center transition ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signup"
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg text-center transition ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            Sign Up
                        </Link>
                    </div>

                    {/* Form */}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

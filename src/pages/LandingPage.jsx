import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-600">

            {/* NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 animate-slide-down">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            H
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            HostelFix
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-orange-600 border border-transparent hover:border-orange-100 hover:bg-orange-50 transition-all duration-300"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-orange-50/50 to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-0 -z-10 w-1/2 h-full bg-gradient-to-tr from-rose-50/50 to-transparent blur-3xl" />

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
                        <span className="text-sm font-semibold text-orange-600 tracking-wide uppercase">
                            🚀 The Future of Hostel Management
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
                        Fix Hostel Issues. <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-rose-600">
                            Faster. Transparently.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
                        The all-in-one platform for students and management to report, track, and resolve maintenance issues in real-time. No more delays.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-bold bg-gray-900 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/20 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Get Started Now
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-xl text-gray-700 font-bold bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300">
                            View Live Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* FEATURE CARDS (NYKAA STYLE) */}
            <section className="py-20 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
                        <p className="text-gray-500 text-lg">Streamlining hostel life with powerful features.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Instant Reporting", desc: "Log issues in seconds with photo evidence.", icon: "⚡" },
                            { title: "Real-time Tracking", desc: "Live status updates on your complaints.", icon: "📡" },
                            { title: "Priority Support", desc: "Urgent issues get flagged immediately.", icon: "🔥" },
                            { title: "Transparency", desc: "See exactly who is handling your request.", icon: "🛡️" },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 transform hover:-translate-y-2"
                            >
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS (ZOMATO STYLE FLOW) */}
            <section className="py-20 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">

                        <div className="w-full md:w-1/2 pr-8">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                From <span className="text-orange-500">Broken</span> to <span className="text-green-500">Fixed</span> in 3 steps
                            </h2>
                            <p className="text-xl text-gray-500 mb-8">
                                Our process is designed to cut through the bureaucracy and get things done.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Report the Issue", text: "Snap a photo, describe the problem, and submit it in seconds. Your hostel, block, and room are tagged automatically." },
                                    { step: "02", title: "Assigned & Tracked", text: "The issue is instantly routed to the appropriate caretaker or maintenance team.Track progress in real time with full status transparency." },
                                    { step: "03", title: "Resolved & Verified", text: "Get notified once the issue is resolved.Every update is logged, time-stamped, and accountable." }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <span className="text-4xl font-black text-gray-100">{s.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-1">{s.title}</h4>
                                            <p className="text-gray-500">{s.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 blur-[100px] opacity-20 rounded-full" />
                            <div className="relative bg-white border border-gray-100 shadow-2xl rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center gap-4 mb-6 border-b border-gray-50 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">✅</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Fan Repair</p>
                                        <p className="text-xs text-gray-500">Ticket #2049 • Resolved just now</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-2 w-3/4 bg-gray-100 rounded-full"></div>
                                    <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-900 -z-10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-orange-500/20 blur-[120px] rounded-full" />

                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">
                        Ready to upgrade your hostel experience?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of students and management staff using HostelFix to create better living spaces.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-2xl shadow-orange-900/50 transform hover:scale-105 transition-all duration-300 animate-pulse-slow"
                    >
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white font-bold text-xs">H</div>
                        <span className="font-bold text-gray-900">HostelFix</span>
                    </div>
                    <p className="text-sm text-gray-500">© 2024 HostelFix Inc. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ReportIssueModal from '../../components/ReportIssueModal';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const DashboardHome = () => {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({ active: 0, resolved: 0, pending: 0 });
    const [recentIssues, setRecentIssues] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch Stats & Recent Issues (Parallel if possible, but sequential is safer for now)
            const { data: issuesData, error: issuesError } = await supabase
                .from('issues')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            if (issuesError) throw issuesError;

            // Calculate Stats
            const counts = { active: 0, resolved: 0, pending: 0 };
            issuesData.forEach(issue => {
                const status = issue.status.toLowerCase();
                if (status === 'resolved' || status === 'closed') {
                    counts.resolved++;
                } else if (status === 'reported') {
                    counts.pending++;
                } else {
                    counts.active++;
                }
            });
            setStats(counts);
            setRecentIssues(issuesData.slice(0, 3)); // Top 3 most recent

            // 2. Fetch Announcements (BLOCK-WISE FILTER ✅)
// 2. Fetch Announcements (BLOCK-WISE FILTER ✅)
const studentBlock = `Block ${profile.block}`;

const { data: annData, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .or(`hostel.is.null,hostel.eq.${studentBlock}`)
    .order('created_at', { ascending: false })
    .limit(2);

if (annError) throw annError;
setAnnouncements(annData);




        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
            case 'reported': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-orange-600 bg-orange-50 border-orange-200';
        }
    };

    return (
        <div className="pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Hello, {profile?.name ? profile.name.split(' ')[0] : 'Student'}! 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Here's what's happening in your hostel today.</p>
                </div>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Report Issue
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Issues</h3>
                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.active}</p>
                        <p className="text-xs text-gray-400 mt-1">Currently in progress</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <svg className="w-24 h-24 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pending</h3>
                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.pending}</p>
                        <p className="text-xs text-gray-400 mt-1">Awaiting acknowledgement</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <svg className="w-24 h-24 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Resolved</h3>
                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.resolved}</p>
                        <p className="text-xs text-gray-400 mt-1">successfully closed</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <svg className="w-24 h-24 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <button onClick={() => setIsReportModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-100 hover:bg-orange-50/30 transition-all group">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-orange-700">Report Issue</span>
                </button>

                <Link to="/student/complaints" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">My Complaints</span>
                </Link>

                <Link to="/student/feed" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-100 hover:bg-purple-50/30 transition-all group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700">Community Feed</span>
                </Link>

                <Link to="/student/lost-found" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-100 hover:bg-rose-50/30 transition-all group">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-rose-700">Lost & Found</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                        <Link to="/student/complaints" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View All</Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading activity...</div>
                        ) : recentIssues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                </div>
                                <h3 className="text-gray-900 font-semibold mb-1">No recent activity</h3>
                                <p className="text-gray-500 text-sm mb-4">You haven't reported any issues yet.</p>
                                <button onClick={() => setIsReportModalOpen(true)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                                    Report Your First Issue
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentIssues.map(issue => (
                                    <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{issue.title}</h4>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {format(new Date(issue.created_at), 'MMM d')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{issue.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400 capitalize">• {issue.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Announcements */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
                        <Link to="/student/announcements" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View All</Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading announcements...</div>
                        ) : announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                                </div>
                                <h3 className="text-gray-900 font-semibold mb-1">No announcements</h3>
                                <p className="text-gray-500 text-sm">Everything is quiet for now.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                {format(new Date(ann.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-1">{ann.title}</h4>
                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                            {ann.content}
                                        </p>
                                    </div>
                                ))}
                                <div className="p-3 bg-gray-50 text-center">
                                    <Link to="/student/announcements" className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors">
                                        Check Older Announcements
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onIssueReported={fetchData}
            />
        </div>
    );
};

export default DashboardHome;

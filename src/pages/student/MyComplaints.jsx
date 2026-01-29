import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const MyComplaints = () => {
    const { user, profile } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({ reported: 0, in_progress: 0, resolved: 0 });
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchIssues = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('issues')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setIssues(data);

                const counts = { reported: 0, in_progress: 0, resolved: 0 };
                data.forEach(issue => {
                    const status = issue.status.toLowerCase();
                    if (status === 'resolved' || status === 'closed') counts.resolved++;
                    else if (status === 'reported') counts.reported++;
                    else counts.in_progress++;
                });
                setStats(counts);

            } catch (err) {
                console.error("Error fetching complaints:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, [user, refreshKey]);

    const filteredIssues = filter === 'all'
        ? issues
        : issues.filter(issue => {
            const status = issue.status.toLowerCase();
            if (filter === 'Reported') return status === 'reported';
            if (filter === 'In Progress') return status !== 'reported' && status !== 'resolved' && status !== 'closed';
            if (filter === 'Resolved') return status === 'resolved' || status === 'closed';
            return true;
        });

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'in progress': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'emergency': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="pb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Complaints</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-yellow-600 mb-1">{stats.reported}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600 mb-1">{stats.in_progress}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">In Progress</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-green-600 mb-1">{stats.resolved}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'Reported', 'In Progress', 'Resolved'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                            filter === tab
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        {tab === 'all' ? 'All Complaints' : tab}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIssues.map((issue) => (
                        <div
                            key={issue.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4"
                        >
                            {/* LEFT CONTENT */}
                            <div className="flex-1">
                                <h3 className="font-bold">{issue.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{issue.description}</p>

                                {/* IMAGE (OPTIONAL) */}
                                {issue.media_urls && issue.media_urls.length > 0 && (
                                    <div className="mt-3">
                                        <img
                                            src={issue.media_urls[0]}
                                            alt="issue"
                                            className="w-64 h-40 object-cover rounded-xl border"
                                        />
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 mt-2">
                                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                                </div>
                            </div>

                            {/* RIGHT BADGES */}
                            <div className="flex flex-row md:flex-col items-start md:items-end gap-2 min-w-[140px]">
                                <span
                                    className={`px-2.5 py-1 rounded text-xs font-bold border ${getStatusColor(issue.status)}`}
                                >
                                    {issue.status}
                                </span>

                                <span
                                    className={`px-2.5 py-1 rounded text-xs font-semibold border ${getPriorityColor(issue.priority)}`}
                                >
                                    {issue.priority} Priority
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyComplaints;


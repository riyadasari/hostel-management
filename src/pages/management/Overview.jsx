import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';
import { AlertCircle, CheckCircle, Clock, FileText, Activity, Hourglass } from 'lucide-react';
import { differenceInHours, differenceInMinutes } from 'date-fns';

const Overview = () => {
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0,
        reported: 0,
        resolved: 0,
        pending: 0,
        avgResolutionTime: 0
    });

    const [statusData, setStatusData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [hostelData, setHostelData] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) {
                setLoading(false);
                return;
            }

            // 1. Basic Counts
            const total = data.length;
            const reported = data.filter(i => i.status === 'Reported').length;
            const inProgress = data.filter(i => i.status === 'In Progress').length;
            const assigned = data.filter(i => i.status === 'Assigned').length;
            const resolved = data.filter(i => i.status === 'Resolved').length;
            const closed = data.filter(i => i.status === 'Closed').length;

            const pending = reported + inProgress + assigned;
            const resolvedTotal = resolved + closed;

            // 2. Avg Resolution Time (Created -> Resolved/Closed)
            const resolvedIssues = data.filter(
                i => (i.status === 'Resolved' || i.status === 'Closed') && i.created_at && i.resolved_at
            );

            let totalResolutionMinutes = 0;
            resolvedIssues.forEach(i => {
                totalResolutionMinutes += differenceInMinutes(new Date(i.resolved_at), new Date(i.created_at));
            });
            const avgResolutionMinutes = resolvedIssues.length > 0
                ? (totalResolutionMinutes / resolvedIssues.length)
                : 0;

            // 3. Avg Response Time (Created -> Assigned/In Progress)
            // 3. Avg Response Time (Created -> First Response)
            // Uses dedicated 'responded_at' timestamp
            const respondedIssues = data.filter(
                i => i.responded_at && i.created_at
            );

            let totalResponseMinutes = 0;
            respondedIssues.forEach(i => {
                const diff = differenceInMinutes(new Date(i.responded_at), new Date(i.created_at));
                if (diff >= 0) totalResponseMinutes += diff;
            });

            const avgResponseMinutes = respondedIssues.length > 0
                ? (totalResponseMinutes / respondedIssues.length)
                : 0;

            const formatDuration = (mins) => {
                if (mins < 1) return '0 min';
                if (mins < 60) return `${Math.round(mins)} min`;
                return `${(mins / 60).toFixed(1)} h`;
            };

            setStats({
                total,
                pending,
                resolved: resolvedTotal,
                avgResolutionTime: formatDuration(avgResolutionMinutes),
                avgResponseTime: formatDuration(avgResponseMinutes)
            });

            // 4. Pending vs Resolved (Donut Data)
            const ratioData = [
                { name: 'Pending', value: pending },
                { name: 'Resolved', value: resolvedTotal }
            ];
            setStatusData(ratioData); // Re-purposing statusData for this specific requirement

            // 5. Category Frequency
            const categoryMap = {};
            data.forEach(i => {
                const key = i.category || 'Uncategorized';
                categoryMap[key] = (categoryMap[key] || 0) + 1;
            });
            setCategoryData(
                Object.keys(categoryMap).map(k => ({ name: k, count: Number(categoryMap[k]) }))
            );

            // 6. Block-wise Density
            const blockMap = {};
            data.forEach(i => {
                const key = i.block ? i.block : 'Unknown';
                blockMap[key] = (blockMap[key] || 0) + 1;
            });
            setHostelData(
                Object.keys(blockMap).map(k => ({ name: k, issues: Number(blockMap[k]) }))
            );

        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // SLATE / INDIGO Palette
    const COLORS = ['#6366F1', '#14B8A6']; // Indigo (Pending), Teal (Resolved)
    const BAR_COLOR = '#8B5CF6'; // Violet for bars

    if (loading) {
        return (
            <div className="p-10 text-center text-slate-400">
                Loading analytics...
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Analytics & Monitoring
                </h1>
                <p className="text-slate-500 text-sm">Real-time insights and issue tracking.</p>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Issues"
                    value={stats.total}
                    icon={FileText}
                    colorClass="bg-slate-100 text-slate-700"
                />
                <StatCard
                    title="Avg Response Time"
                    value={stats.avgResponseTime}
                    icon={Activity}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                    title="Avg Resolution Time"
                    value={stats.avgResolutionTime}
                    icon={CheckCircle}
                    colorClass="bg-teal-50 text-teal-600"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%`}
                    icon={Hourglass}
                    colorClass="bg-violet-50 text-violet-600"
                />
            </div>

            {/* MAIN CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Categories (Span 2) */}
                <div className="lg:col-span-2">
                    <ChartCard title="Most Frequently Reported Categories">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: '#475569', fontSize: 13 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ChartCard>
                </div>

                {/* 2. Pending vs Resolved (Span 1) */}
                <div className="lg:col-span-1">
                    <ChartCard title="Pending vs Resolved">
                        <div className="relative h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                    >
                                        {statusData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-slate-700">{stats.total}</span>
                            </div>
                        </div>
                    </ChartCard>
                </div>

                {/* 3. Block Density (Span 3 / Full Width) */}
                <div className="lg:col-span-3">
                    <ChartCard title="Block-wise Issue Density">
                        <BarChart data={hostelData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                cursor={{ fill: '#f1f5f9' }}
                            />
                            <Bar dataKey="issues" fill="#14B8A6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
                <Icon className="w-6 h-6" />
            </div>
            {/* Optional trend indicator or menu could go here */}
        </div>
        <div>
            <p className="text-3xl font-extrabold text-slate-800">{value}</p>
            <p className="text-slate-500 text-sm font-medium mt-1">{title}</p>
        </div>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-[320px] hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            {title}
        </h3>
        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

export default Overview;

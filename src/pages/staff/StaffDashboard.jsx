import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Clock, MessageSquare, Image as ImageIcon } from 'lucide-react';

const StaffDashboard = () => {
    const { profile } = useAuth();

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);
    const [showRemarksIssueId, setShowRemarksIssueId] = useState(null);
    const [remarks, setRemarks] = useState([]);



    useEffect(() => {
        fetchAssignedIssues();
    }, []);

    // ===========================
    // FETCH ASSIGNED ISSUES (RLS SAFE)
    // ===========================
    const fetchAssignedIssues = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .eq('assigned_to', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setIssues(data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    // ===========================
    // STATUS UPDATE (STRICT RLS & SCHEMA MATCH)
    // ===========================
    const handleStatusUpdate = async (issueId, newStatus) => {
        try {
            const updates = {
                status: newStatus
            };

            if (newStatus === 'Resolved' || newStatus === 'Closed') {
                updates.resolved_at = new Date().toISOString();
            }

            // ✅ FIRST RESPONSE ONLY (e.g. Staff starts work)
            // Need to check current issue state. 'issues' is available in scope.
            const currentIssue = issues.find(i => i.id === issueId);
            if (currentIssue && !currentIssue.responded_at && (newStatus === 'In Progress')) {
                updates.responded_at = new Date().toISOString();
            }

            // ✅ MAIN UPDATE (this works)
            const { error } = await supabase
                .from('issues')
                .update(updates)
                .eq('id', issueId);

            if (error) {
                console.error('Status update failed:', error);
                alert('Failed to update status');
                return;
            }

            // ✅ UI update
            setIssues(prev =>
                prev.map(issue =>
                    issue.id === issueId
                        ? { ...issue, ...updates }
                        : issue
                )
            );

            // 🟡 OPTIONAL LOG (DO NOT FAIL MAIN FLOW)
            if (profile?.id) {
                const { error: commentError } = await supabase
                    .from('issue_comments')
                    .insert({
                        issue_id: issueId,
                        user_id: profile.id,
                        comment: `System: Status changed to ${newStatus}`,
                        created_at: new Date().toISOString()
                    });

                if (commentError) {
                    console.warn('Comment insert failed (ignored):', commentError);
                }
            }

        } catch (err) {
            console.error('Unexpected error:', err);
            // ❌ REMOVE alert — this was the fake error
        }
    };

    const fetchRemarksForStaff = async (issueId) => {
        const { data, error } = await supabase
            .from('issue_remarks')
            .select(`
            id,
            remark,
            created_at,
            profiles:profiles!created_by(name, role)
        `)
            .eq('issue_id', issueId)
            .in('profiles.role', ['management', 'admin'])
            .order('created_at', { ascending: false });

        if (!error) {
            setRemarks(data || []);
            setShowRemarksIssueId(issueId);
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'Assigned': return 'bg-orange-100 text-orange-800';
            case 'In Progress': return 'bg-purple-100 text-purple-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Reported': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading assignments...</div>;
    }


    return (
        <div className="pb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Assignments</h1>
            <p className="text-gray-500 mb-6">Manage issues assigned to you.</p>

            {issues.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center">
                    <p className="text-gray-400">No pending issues assigned to you.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {issues.map(issue => (
                        <div key={issue.id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold">{issue.title}</h3>
                                <p className="text-sm text-gray-600">
                                    Location: {issue.hostel} - {issue.room}
                                </p>

                                {/* ⚡ ACTION BOX */}
                                <div className="mt-3 flex flex-wrap items-center gap-2 p-2 bg-orange-50/50 rounded-lg border border-orange-100">
                                    <button
                                        onClick={() => fetchRemarksForStaff(issue.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        View Remarks
                                    </button>

                                    {/* 🖼 IMAGE VIEW */}
                                    {issue.media_urls && issue.media_urls.length > 0 ? (
                                        <button
                                            onClick={() => setPreviewImage(issue.media_urls[0])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            View Image
                                        </button>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-full text-xs font-medium cursor-not-allowed">
                                            <ImageIcon className="w-3.5 h-3.5 opacity-50" />
                                            No Image
                                        </span>
                                    )}
                                </div>

                            </div>

                            <div className="flex items-center gap-2">
                                {issue.status !== 'Resolved' && (
                                    <>
                                        {issue.status !== 'In Progress' && (
                                            <button
                                                onClick={() => handleStatusUpdate(issue.id, 'In Progress')}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium text-sm transition-colors cursor-pointer"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Start Work
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleStatusUpdate(issue.id, 'Resolved')}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition-colors cursor-pointer"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Resolve
                                        </button>
                                    </>
                                )}
                                {issue.status === 'Resolved' && (
                                    <div className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm flex items-center gap-2 cursor-default">
                                        <CheckCircle className="w-4 h-4" />
                                        Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-xl p-4 max-w-4xl w-full relative mx-4">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all z-10 shadow-lg"
                        >
                            Close
                        </button>


                        <img
                            src={previewImage}
                            alt="Issue"
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}


            {showRemarksIssueId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg relative">
                        <button
                            onClick={() => setShowRemarksIssueId(null)}
                            className="absolute top-3 right-4 text-xl text-gray-500"
                        >
                            ✕
                        </button>

                        <h3 className="text-lg font-bold mb-4">
                            Management Remarks
                        </h3>

                        {remarks.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                No remarks from management.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {remarks.map(r => (
                                    <div
                                        key={r.id}
                                        className="bg-gray-50 border rounded-lg p-3 text-sm"
                                    >
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span className="font-semibold">
                                                {r.profiles?.name}
                                            </span>
                                            <span>
                                                {format(new Date(r.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p>{r.remark}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
};

export default StaffDashboard;

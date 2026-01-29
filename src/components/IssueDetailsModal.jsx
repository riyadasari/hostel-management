import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Send, User, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

const IssueDetailsModal = ({ issueId, isOpen, onClose }) => {
    const { profile } = useAuth();

    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const [remarks, setRemarks] = useState([]);
    const [newRemark, setNewRemark] = useState('');

    useEffect(() => {
        if (issueId && isOpen) {
            fetchDetails();
        }
    }, [issueId, isOpen]);

    // ======================
    // FETCH ISSUE + COMMENTS
    // ======================
    const fetchDetails = async () => {
        setLoading(true);
        try {
            const { data: issueData, error: issueError } = await supabase
                .from('issues')
                .select(`
                    *,
                    profiles:profiles!created_by(name)
                `)
                .eq('id', issueId)
                .single();

            if (issueError) throw issueError;
            setIssue(issueData);

            const { data: commentsData, error: commentsError } = await supabase
                .from('issue_comments')
                .select(`
                    *,
                    profiles:profiles!user_id(name, role)
                `)
                .eq('issue_id', issueId)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;
            setComments(commentsData || []);

            fetchRemarks();
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    // ======================
    // FETCH INTERNAL REMARKS
    // ======================
    const fetchRemarks = async () => {
        if (profile?.role === 'student') return;

        const { data, error } = await supabase
            .from('issue_remarks')
            .select(`
                id,
                remark,
                created_at,
                profiles:profiles!created_by(name, role)
            `)
            .eq('issue_id', issueId)
            .order('created_at', { ascending: false });

        if (!error) {
            setRemarks(data || []);
        }
    };

    // ======================
    // SEND DISCUSSION MESSAGE
    // ======================
    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!profile?.id) return;

        const { error } = await supabase
            .from('issue_comments')
            .insert({
                issue_id: issueId,
                user_id: profile.id,
                comment: newComment,
                is_internal: false, // ✅ PUBLIC DISCUSSION
                created_at: new Date().toISOString()
            });

        if (!error) {
            setNewComment('');
            fetchDetails();
        }
    };

    // ======================
    // ADD INTERNAL REMARK
    // ======================
    const handleAddRemark = async () => {
        if (!newRemark.trim()) return;
        if (!profile?.id) return;

        const { error } = await supabase
            .from('issue_remarks')
            .insert({
                issue_id: issueId,
                created_by: profile.id,
                remark: newRemark
            });

        if (!error) {
            setNewRemark('');
            fetchRemarks();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        Issue Details
                    </h2>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading...</p>
                    ) : (
                        <>
                            {/* ISSUE INFO */}
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <h3 className="text-xl font-bold">{issue?.title}</h3>
                                <p className="text-gray-600 mt-2">{issue?.description}</p>

                                <div className="flex gap-4 text-xs text-gray-500 mt-3">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {issue?.profiles?.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(issue.created_at), 'MMM d, yyyy h:mm a')}
                                    </span>
                                </div>
                            </div>

                            {/* DISCUSSION */}
                            <div>
                                <h4 className="font-bold mb-3">Discussion History</h4>

                                {comments.filter(c => c.is_internal !== true).length === 0 ? (
                                    <p className="text-gray-400 text-sm">No messages yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {comments
                                            .filter(c => c.is_internal !== true) // ✅ IMPORTANT FIX
                                            .map(c => (
                                                <div key={c.id} className="bg-white border p-3 rounded-lg">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span className="font-semibold">
                                                            {c.profiles?.name}
                                                            {c.profiles?.role !== 'student' && (
                                                                <span className="ml-1 text-[10px] bg-gray-200 px-1 rounded">
                                                                    {c.profiles.role}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span>
                                                            {format(new Date(c.created_at), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{c.comment}</p>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* INTERNAL REMARKS */}
                            {profile?.role !== 'student' && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                                    <h4 className="font-bold text-yellow-800 mb-2">
                                        Internal Remarks (Staff Only)
                                    </h4>

                                    {remarks.length === 0 ? (
                                        <p className="text-xs text-yellow-700">
                                            No internal remarks yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2 mb-3">
                                            {remarks.map(r => (
                                                <div key={r.id} className="bg-white p-3 rounded border">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-semibold">
                                                            {r.profiles?.name}
                                                        </span>
                                                        <span>
                                                            {format(new Date(r.created_at), 'MMM d, h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{r.remark}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input
                                            value={newRemark}
                                            onChange={(e) => setNewRemark(e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded"
                                            placeholder="Add internal remark (not visible to students)"
                                        />
                                        <button
                                            onClick={handleAddRemark}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FOOTER INPUT */}
                <div className="p-4 border-t bg-gray-50">
                    <form onSubmit={handleSendComment} className="flex gap-2">
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 px-4 py-2 border rounded"
                            placeholder="Type a message..."
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-orange-500 text-white p-2 rounded"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IssueDetailsModal;


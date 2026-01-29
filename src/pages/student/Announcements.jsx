import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);


    // 🔹 COMMENTS STATE
    const [commentsMap, setCommentsMap] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    // 🔹 ADD: current user & role
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isManagement, setIsManagement] = useState(false);


   useEffect(() => {
    fetchAnnouncements();

    // 🔹 ADD BELOW
    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'management' || profile?.role === 'admin') {
            setIsManagement(true);
        }
    };

    fetchUserRole();
}, []);


    const fetchAnnouncements = async () => {
        try {
            // 1️⃣ Get logged-in user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Auth error');
                return;
            }

            // 2️⃣ Get student's BLOCK
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('block')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Profile error:', profileError);
                return;
            }

            const studentBlock = `Block ${profile.block}`;

            // 3️⃣ Fetch announcements
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .or(`hostel.is.null,hostel.eq.${studentBlock}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAnnouncements(data || []);

            // 🔹 FETCH COMMENTS FOR ALL ANNOUNCEMENTS
            fetchComments(data.map(a => a.id));

        } catch (err) {
            console.error("Error fetching announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    // ======================
    // FETCH COMMENTS
    // ======================
    const fetchComments = async (announcementIds) => {
        if (!announcementIds.length) return;

        const { data, error } = await supabase
            .from('announcement_comments')
            .select(`
                id,
                comment,
                created_at,
                user_id,
                announcement_id,
                profiles (
                    name,
                    role
                )
            `)
            .in('announcement_id', announcementIds)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return;
        }

        const grouped = {};
        data.forEach(c => {
            if (!grouped[c.announcement_id]) grouped[c.announcement_id] = [];
            grouped[c.announcement_id].push(c);
        });

        setCommentsMap(grouped);
    };

    // ======================
    // ADD COMMENT
    // ======================
    const handleAddComment = async (announcementId) => {
        const content = commentInputs[announcementId]?.trim();
        if (!content) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('announcement_comments')
            .insert([{
                announcement_id: announcementId,
                user_id: user.id,
                comment: content
            }]);

        if (error) {
            alert('Failed to post comment');
            return;
        }

        setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
        fetchComments(announcements.map(a => a.id));
    };

    // ======================
// DELETE COMMENT
// ======================
const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    const { error } = await supabase
        .from('announcement_comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        alert('Failed to delete comment');
        return;
    }

    // Refresh comments
    fetchComments(announcements.map(a => a.id));
};



    return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h1>

        {loading ? (
            <div className="text-center py-10 text-gray-500">Loading notices...</div>
        ) : announcements.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No announcements at this time.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {announcements.map((notice) => (
                    <div
                        key={notice.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >

                        {/* ======================
                            ANNOUNCEMENT CONTENT
                        ====================== */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {notice.title}
                                </h3>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {format(new Date(notice.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>

                            <p className="text-gray-600 whitespace-pre-line">
                                {notice.content}
                            </p>
                        </div>

                        {/* ======================
                            COMMENTS SECTION
                        ====================== */}
                        <div className="border-t bg-gray-50 p-6">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">
                                Comments
                            </h4>

                            {commentsMap[notice.id]?.length > 0 ? (
                                <div className="space-y-3 mb-4">
                                    {commentsMap[notice.id].map(c => (
                                        <div
                                            key={c.id}
                                            className="bg-white p-3 rounded-lg border text-sm"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800">
                                                        {c.profiles?.name || 'User'}
                                                    </span>

                                                    {/* MANAGEMENT BADGE */}
                                                    {c.profiles?.role === 'management' && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                                                            Management
                                                        </span>
                                                    )}
                                                </div>

                                                {/* ⬇️ ONLY CHANGE IS HERE */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(c.created_at), 'MMM d, h:mm a')}
                                                    </span>

                                                    {(c.user_id === currentUserId || isManagement) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(c.id)}
                                                            className="text-xs text-red-500 hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-gray-600">{c.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 mb-4">
                                    No comments yet. Be the first to comment.
                                </p>
                            )}

                            {/* ADD COMMENT INPUT */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={commentInputs[notice.id] || ''}
                                    onChange={(e) =>
                                        setCommentInputs(prev => ({
                                            ...prev,
                                            [notice.id]: e.target.value
                                        }))
                                    }
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg"
                                />
                                <button
                                    onClick={() => handleAddComment(notice.id)}
                                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg"
                                >
                                    Post
                                </button>
                            </div>
                        </div>

                        {/* ======================
                            FOOTER
                        ====================== */}
                        <div className="bg-gray-100 px-6 py-3 text-xs text-gray-500 flex justify-between">
                            <span>
                                Target:
                                <span className="ml-1 font-semibold">
                                    {notice.hostel ?? 'All Blocks'}
                                </span>
                            </span>
                            <span className="uppercase font-bold text-gray-400">
                                Official Notice
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

};

export default Announcements;

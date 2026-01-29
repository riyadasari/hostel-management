import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const CommunityFeed = () => {
    const { user, profile } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState({}); // { issueId: boolean }
    const [commentInputs, setCommentInputs] = useState({}); // { issueId: string }

    const fetchFeed = async () => {
        try {
            // 1. Fetch Issues ONLY (No ambiguous joins)
            const { data: issuesData, error } = await supabase
                .from('issues')
                .select(`
                    *,
                    issue_likes (user_id),
                    issue_comments (
                        id,
                        comment,
                        created_at,
                        user_id
                    )
                `)
                .eq('visibility', 'public')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("CommunityFeed Error:", error);
                throw error;
            }

            // 2. Extract Unique User IDs (Authors + Commenters)
            const userIds = new Set();
            issuesData.forEach(i => {
                if (i.created_by) userIds.add(i.created_by);
                i.issue_comments?.forEach(c => {
                    if (c.user_id) userIds.add(c.user_id);
                });
            });

            // 3. Fetch Profiles Manually (Bypasses RLS join issues usually)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', Array.from(userIds));

            if (profilesError) console.error("Profile Fetch Error:", profilesError);

            // Create Map for O(1) Lookup
            const profileMap = {};
            profilesData?.forEach(p => {
                profileMap[p.id] = p;
            });

            // 4. Merge Data
            const formattedIssues = issuesData.map(issue => {
                const authorProfile = profileMap[issue.created_by] || { name: 'Unknown' };

                return {
                    ...issue,
                    profiles: authorProfile, // Manual Match
                    likes: issue.issue_likes || [],
                    comments: (issue.issue_comments || []).map(c => ({
                        ...c,
                        profiles: profileMap[c.user_id] || { name: 'Unknown' } // Manual Match
                    })),
                    isLiked: issue.issue_likes?.some(like => like.user_id === user?.id),
                    likeCount: issue.issue_likes?.length || 0,
                    commentCount: issue.issue_comments?.length || 0,
                    authorName: authorProfile.name
                };
            });

            setIssues(formattedIssues);
        } catch (err) {
            console.error("Error fetching feed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const handleLike = async (issueId, currentIsLiked) => {
        if (!user) return; // Optimistic update

        // Optimistic UI Update
        setIssues(prev => prev.map(issue => {
            if (issue.id === issueId) {
                return {
                    ...issue,
                    isLiked: !currentIsLiked,
                    likeCount: currentIsLiked ? issue.likeCount - 1 : issue.likeCount + 1
                };
            }
            return issue;
        }));

        try {
            if (currentIsLiked) {
                // Unlike
                const { error } = await supabase
                    .from('issue_likes')
                    .delete()
                    .eq('issue_id', issueId)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('issue_likes')
                    .insert([{ issue_id: issueId, user_id: user.id }]);
                if (error) throw error;
            }
        } catch (err) {
            console.error("Error toggling like:", err);
            fetchFeed(); // Revert on error
        }
    };

    const handleComment = async (issueId) => {
        const content = commentInputs[issueId]?.trim();
        if (!content) return;

        try {
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) {
                alert("Please login to comment");
                return;
            }

            const { data, error } = await supabase
                .from('issue_comments')
                .insert([{
                    issue_id: issueId,
                    user_id: currentUser.id,
                    comment: content
                }])
                .select()
                .single();

            if (error) throw error;

            console.log("Comment posted:", data);

            // Manual profile merge for immediate UI update
            const newComment = {
                ...data,
                profiles: { name: profile?.name || 'You' }
            };

            // Update UI
            setIssues(prev => prev.map(issue => {
                if (issue.id === issueId) {
                    return {
                        ...issue,
                        comments: [newComment, ...issue.comments],
                        commentCount: issue.commentCount + 1
                    };
                }
                return issue;
            }));

            // Clear input
            setCommentInputs(prev => ({ ...prev, [issueId]: '' }));

        } catch (err) {
            console.error("Error posting comment:", err);
            alert("Failed to post comment. " + err.message);
        }
    };

    const toggleComments = (issueId) => {
        setExpandedComments(prev => ({
            ...prev,
            [issueId]: !prev[issueId]
        }));
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

    const getCategoryIcon = (category) => {
        // Simple mapping for brevity, same as MyComplaints
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
        );
    };

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
                <p className="text-gray-500 text-sm mt-1">See what's happening around your hostel.</p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading feed...</p>
                </div>
            ) : issues.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No public issues yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to share something with the community!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {issues.map((issue) => (
                        <div key={issue.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">

                            {/* Card Header & Content */}
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                            {issue.profiles?.name ? issue.profiles.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{issue.profiles?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(issue.status)}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{issue.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-50">
                                        {issue.description}
                                    </p>
                                </div>

                                {/* ✅ MEDIA PREVIEW (COMMUNITY FEED) */}
{issue.media_urls && issue.media_urls.length > 0 && (
    <div className="px-6 pb-4">
        <div className="flex flex-col gap-3">
            {issue.media_urls.map((url, index) => (
                <img
                    key={index}
                    src={url}
                    alt="issue media"
                    className="w-full max-h-[420px] object-cover rounded-2xl border border-gray-200 shadow-sm"
                />
            ))}
        </div>
    </div>
)}


                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="p-1 bg-gray-100 rounded text-gray-600">
                                            {getCategoryIcon(issue.category)}
                                        </span>
                                        <span className="font-medium capitalize">{issue.category}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span>{issue.hostel || 'Hostel'} - {issue.room || 'Room'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Bar */}
                            <div className="flex items-center border-t border-gray-100 bg-gray-50/50 px-6 py-3 gap-6">
                                <button
                                    onClick={() => handleLike(issue.id, issue.isLiked)}
                                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${issue.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                        }`}
                                >
                                    <svg className={`w-5 h-5 ${issue.isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                    <span>{issue.likeCount} Likes</span>
                                </button>

                                <button
                                    onClick={() => toggleComments(issue.id)}
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    <span>{issue.commentCount} Comments</span>
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments[issue.id] && (
                                <div className="bg-gray-50 border-t border-gray-100 p-6 animate-fadeIn">
                                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {issue.comments?.length > 0 ? (
                                            issue.comments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                                        {comment.profiles?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-gray-900">{comment.profiles?.name || 'User'}</span>
                                                                <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700">{comment.comment}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-xs text-gray-400 py-2">No comments yet. Write the first one!</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            value={commentInputs[issue.id] || ''}
                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(issue.id)}
                                        />
                                        <button
                                            onClick={() => handleComment(issue.id)}
                                            disabled={!commentInputs[issue.id]?.trim()}
                                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommunityFeed;

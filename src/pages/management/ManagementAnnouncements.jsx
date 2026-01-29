import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

const ManagementAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', hostel: '' });
    // 🔹 COMMENTS STATE (ADD BELOW EXISTING STATES)
    const [commentsMap, setCommentsMap] = useState({}); // { announcementId: comments[] }
    const [replyInputs, setReplyInputs] = useState({}); // { announcementId: replyText }


    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('hostel, role')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            let query = supabase.from('announcements').select('*');

            // 🔒 Student → hostel based filtering
            if (profile.role === 'student') {
                query = query.or(`hostel.is.null,hostel.eq.${profile.hostel}`);
            }

            // 👑 Admin → see all announcements
            if (profile.role === 'admin') {
                query = query;
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            setAnnouncements(data || []);
            fetchComments(data.map(a => a.id));

        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false); // ✅ FIXED
        }
    };


    // ======================
    // FETCH COMMENTS (MANAGEMENT VIEW)
    // ======================
    const fetchComments = async (announcementIds) => {
        if (!announcementIds || announcementIds.length === 0) return;

        const { data, error } = await supabase
            .from('announcement_comments')
            .select(`
            id,
            comment,
            created_at,
            user_id,
            announcement_id,
            profiles ( name, role )
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
    // MANAGEMENT REPLY
    // ======================
    const handleReply = async (announcementId) => {
        const content = replyInputs[announcementId]?.trim();
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
            alert('Failed to reply');
            return;
        }

        setReplyInputs(prev => ({ ...prev, [announcementId]: '' }));
        fetchComments(announcements.map(a => a.id));
    };


    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Title and content are required');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newAnnouncement = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                hostel: formData.hostel || null,
                created_by: user.id,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('announcements')
                .insert([newAnnouncement])
                .select()
                .single();

            if (error) {
                console.error(error);
                alert('Failed to create announcement');
                return;
            }

            setAnnouncements(prev => [data, ...prev]);
            setIsCreating(false);
            setFormData({ title: '', content: '', hostel: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (!error) {
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        }
    };

    return (
        <div className="pb-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Announcements</h1>
                    <p className="text-sm text-gray-500">Manage hostel-wide announcements</p>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded"
                >
                    <Plus size={16} />
                    New Announcement
                </button>
            </div>

            {isCreating && (
                <div className="mb-6 bg-white p-4 rounded border">
                    <form onSubmit={handleCreate} className="space-y-3">
                        <input
                            className="w-full border p-2"
                            placeholder="Title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />

                        <select
                            className="w-full border p-2"
                            value={formData.hostel}
                            onChange={e => setFormData({ ...formData, hostel: e.target.value })}
                        >
                            <option value="">All Hostels</option>
                            <option value="Block A">Block A</option>
                            <option value="Block B">Block B</option>
                            <option value="Block C">Block C</option>
                        </select>

                        <textarea
                            className="w-full border p-2"
                            rows="4"
                            placeholder="Content"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />

                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-orange-600 text-white rounded">
                                Publish
                            </button>
                            <button type="button" onClick={() => setIsCreating(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : announcements.length === 0 ? (
                <p>No announcements yet.</p>
            ) : (
                announcements.map(item => (
                    <div key={item.id} className="bg-white p-4 border rounded mb-3">

                        <h3 className="font-bold">{item.title}</h3>

                        <span className="text-xs">
                            {item.hostel || 'All Hostels'}
                        </span>

                        <p className="mt-2">{item.content}</p>

                        <p className="text-xs text-gray-400">
                            {format(new Date(item.created_at), 'MMM dd, yyyy')}
                        </p>
                        {/* ======================
    COMMENTS (MANAGEMENT VIEW)
====================== */}
                        <div className="mt-4 border-t pt-3 bg-gray-50 rounded">

                            <h4 className="text-sm font-bold text-gray-700 mb-2">
                                Comments
                            </h4>

                            {commentsMap[item.id]?.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {commentsMap[item.id].map(c => (
                                        <div
                                            key={c.id}
                                            className={`p-3 rounded text-sm ${c.profiles?.role === 'admin'
                                                    ? 'bg-orange-50 border border-orange-200'
                                                    : 'bg-white border'
                                                }`}
                                        >
                                            <div className="flex justify-between mb-1">
                                                <span className="font-semibold">
                                                    {c.profiles?.name || 'User'}
                                                    {c.profiles?.role === 'admin' && (
                                                        <span className="ml-2 text-xs text-orange-600 font-bold">
                                                            (Management)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {format(new Date(c.created_at), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">{c.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 mb-3">
                                    No comments yet.
                                </p>
                            )}

                            {/* REPLY INPUT */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Reply as management..."
                                    value={replyInputs[item.id] || ''}
                                    onChange={(e) =>
                                        setReplyInputs(prev => ({
                                            ...prev,
                                            [item.id]: e.target.value
                                        }))
                                    }
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg"
                                />
                                <button
                                    onClick={() => handleReply(item.id)}
                                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 mt-2"
                        >
                            <Trash2 size={16} />
                        </button>

                    </div>

                ))
            )}
        </div>
    );
};

export default ManagementAnnouncements;


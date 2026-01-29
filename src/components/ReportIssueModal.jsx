import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ReportIssueModal = ({ isOpen, onClose, onIssueReported }) => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'cleanliness',
        priority: 'medium',
        visibility: 'private',
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'public' : 'private') : value
        }));
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    // ✅ EXISTING helper — NOW ACTUALLY USED
    const uploadMedia = async (files, issueId) => {
        const urls = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${issueId}/${crypto.randomUUID()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('issue-media')
               .upload(filePath, file, {
    contentType: file.type
});


            if (error) {
                console.error('Upload error:', error);
                continue;
            }

            const { data } = supabase.storage
                .from('issue-media')
                .getPublicUrl(filePath);

            urls.push(data.publicUrl);
        }

        return urls;
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const issueId = crypto.randomUUID();

        // ✅ STEP 1: Upload FIRST
        const mediaUrls = files.length > 0
            ? await uploadMedia(files, issueId)
            : [];
        console.log('mediaUrls value →', mediaUrls);
        console.log('is array →', Array.isArray(mediaUrls));

        // 🔴 ADD THIS CONSOLE.LOG (ONLY ADDITION)
        console.log('INSERT PAYLOAD CHECK →', {
            id: issueId,
            created_by: user.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            visibility: formData.visibility,
            status: 'Reported',
            media_urls: mediaUrls
        });

        // ✅ STEP 2: Insert issue ONCE with media_urls
        const { error } = await supabase
            .from('issues')
            .insert([
                {
                    id: issueId,
                    created_by: user.id,
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    priority: formData.priority,
                    visibility: formData.visibility,
                    status: 'Reported',
                    hostel: profile?.hostel,
                    block: profile?.block,
                    room: profile?.room,
                    media_urls: mediaUrls
                }
            ]);

        if (error) throw error;

        // 3️⃣ Reset & close (UNCHANGED)
        setFormData({
            title: '',
            description: '',
            category: 'cleanliness',
            priority: 'medium',
            visibility: 'private',
        });
        setFiles([]);

        onIssueReported && onIssueReported();
        onClose();
        alert('Issue reported successfully!');

    } catch (error) {
        console.error("Error reporting issue:", error);
        alert('Failed to report issue: ' + error.message);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Report New Issue</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* 🔽 UI UNCHANGED 🔽 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Leakage in Bathroom"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white"
                        >
                            <option value="cleanliness">Cleanliness</option>
                            <option value="electrical">Electrical</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="internet">Internet</option>
                            <option value="other">Other</option>
                        </select>

                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>

                    <textarea
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe the issue clearly..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
                        required
                    />

                    {/* 📷 IMAGE / VIDEO UPLOAD */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Upload Images / Videos (optional)
                        </label>

                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition">
                            <span className="text-sm font-medium text-gray-600">
                                Click to upload or drag & drop
                            </span>
                            <span className="text-xs text-gray-400">
                                Images & videos supported
                            </span>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-gray-100 rounded-lg border"
                                    >
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.visibility === 'public'}
                            onChange={handleChange}
                            name="visibility"
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-600">
                            Make issue public (visible in community)
                        </span>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-300 rounded-xl py-2 font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl py-2 font-bold disabled:opacity-60"
                        >
                            {loading ? 'Submitting...' : 'Report Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssueModal;

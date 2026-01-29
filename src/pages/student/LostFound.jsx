import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const LostFound = () => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState('lost'); // 'lost', 'found', 'claimed'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);


    // New Item Form State
    const [newItem, setNewItem] = useState({
        item_name: '',
        description: '',
        location: '',
        status: 'lost'
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            // 1. Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from('lost_found_items')
                .select('*')
                .eq('status', activeTab)
                .order('created_at', { ascending: false });

            if (itemsError) throw itemsError;

            // 2. Fetch Profiles (Client-side join)
            const userIds = [...new Set(itemsData.map(item => item.reported_by).filter(Boolean))];
            let profilesMap = {};

            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', userIds);

                if (profilesError) console.error("Error fetching profiles:", profilesError);

                if (profilesData) {
                    profilesData.forEach(p => profilesMap[p.id] = p);
                }
            }

            // 3. Merge
            const mergedItems = itemsData.map(item => ({
                ...item,
                profiles: profilesMap[item.reported_by] || { name: 'Unknown' }
            }));

            setItems(mergedItems);
        } catch (err) {
            console.error("Error fetching lost/found:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const uploadLostFoundImage = async (file, itemId) => {
        const ext = file.name.split('.').pop();
        const filePath = `${itemId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
            .from('lost-found')
            .upload(filePath, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('lost-found')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };


    const handleReportSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !currentUser) {
                console.error("Auth error:", authError);
                alert("Please log in to report items.");
                return;
            }

            console.log("Reporting item as user:", currentUser.id);

            let imageUrl = null;

            if (imageFile) {
                imageUrl = await uploadLostFoundImage(
                    imageFile,
                    crypto.randomUUID()
                );
            }

            const payload = {
                item_name: newItem.item_name,
                description: newItem.description,
                location: newItem.location,
                hostel: profile?.hostel || null,
                block: profile?.block || null,
                status: activeTab === 'claimed' ? 'lost' : activeTab,
                reported_by: currentUser.id,
                image_url: imageUrl   // ✅ ADD THIS
            };

            console.log("Insert Payload:", payload);

            const { error } = await supabase
                .from('lost_found_items')
                .insert([payload]);

            if (error) throw error;

            setShowForm(false);
            setNewItem({ item_name: '', description: '', location: '', status: 'lost' });
            setImageFile(null);

            if (activeTab !== 'claimed') fetchItems();
            else setActiveTab('lost'); // Switch to lost to see new item
            alert('Item reported successfully!');
        } catch (err) {
            console.error("Error reporting item:", err);
            alert('Error reporting item: ' + err.message);
        }
    };

    const handleClaimItem = async (itemId, type) => {
        const confirmMsg = type === 'found'
            ? "Are you sure this is your item? This will mark it as claimed."
            : "Has this item been recovered/found? This will mark it as resolved.";

        if (!confirm(confirmMsg)) return;

        try {
            // Get fresh user session
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !currentUser) {
                console.error("Auth error:", authError);
                alert("Please log in to claim items.");
                return;
            }

            console.log("Claiming item:", itemId);
            console.log("User:", currentUser.id);

            const { error } = await supabase
                .from('lost_found_items')
                .update({
                    status: 'claimed',
                    claimed_by: currentUser.id,
                    claimed_at: new Date().toISOString()
                })
                .eq('id', itemId);

            if (error) {
                console.log("Update error:", error);
                throw error;
            }

            // Remove from current view
            setItems(prev => prev.filter(item => item.id !== itemId));
            alert(type === 'found' ? "Item claimed successfully!" : "Item marked as recovered!");
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'lost': return 'bg-red-100 text-red-700 border-red-200';
            case 'found': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'claimed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="pb-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
                    <p className="text-gray-500 text-sm mt-1">Report lost items or check for found ones.</p>
                </div>
                <button
                    onClick={() => {
                        setNewItem(prev => ({ ...prev, status: activeTab === 'claimed' ? 'lost' : activeTab }));
                        setShowForm(!showForm);
                    }}
                    className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    {showForm ? 'Cancel Report' : 'Report Item'}
                </button>
            </div>

            {/* TABS */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit mb-8">
                {['lost', 'found', 'claimed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'claimed' ? 'Claimed / Resolved' : `${tab} Items`}
                    </button>
                ))}
            </div>

            {/* REPORT FORM */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Report Details</h3>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                                <input
                                    type="text"
                                    value={newItem.item_name}
                                    onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="e.g. Black Sony Headphones"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last seen / Found at</label>
                                <input
                                    type="text"
                                    value={newItem.location}
                                    onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="e.g. Common Room, Block A"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                            <textarea
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none h-24 resize-none bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Describe the item (color, brand, distinctive marks)..."
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Upload Image (optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files[0])}
                                className="w-full text-sm text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                            <select
                                value={newItem.status}
                                onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 outline-none bg-gray-50"
                            >
                                <option value="lost">Lost Item</option>
                                <option value="found">Found Item</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                            Submit Report
                        </button>
                    </form>
                </div>
            )}

            {/* LIST */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading items...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <p className="text-gray-500 font-medium">No {activeTab} items found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden">

                            {/* Card Header & Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.item_name}</h3>
                                        <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                            Reported by {item.profiles?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${getStatusBadge(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="mb-5">
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {item.description || 'No description provided.'}
                                    </p>
                                </div>

                                {/* Details Grid */}
                                <div className="mt-auto space-y-3">
                                    <div className="flex items-start gap-3 text-xs text-gray-500 p-3 bg-gray-50 rounded-xl border border-gray-100/60">
                                        <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <div>
                                            <p className="font-bold text-gray-700 mb-0.5">Location</p>
                                            <span className="font-medium">{item.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                        </div>

                                        {item.status === 'claimed' && item.claimed_at && (
                                            <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                <span>Resolved</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
                                {item.image_url ? (
                                    <button
                                        onClick={() => setPreviewImage(item.image_url)}
                                        className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all group-hover:border-gray-300"
                                    >
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        View Image
                                    </button>
                                ) : null}

                                {item.status === 'found' && (
                                    <button
                                        onClick={() => handleClaimItem(item.id, 'found')}
                                        className="w-full py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-100 hover:scale-[1.02] transition-all shadow-sm"
                                    >
                                        Claim This Item
                                    </button>
                                )}
                                {item.status === 'lost' && (
                                    <button
                                        onClick={() => handleClaimItem(item.id, 'lost')}
                                        className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-100 hover:scale-[1.02] transition-all shadow-sm"
                                    >
                                        I Found This
                                    </button>
                                )}
                                {item.status === 'claimed' && (
                                    <button disabled className="w-full py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl text-xs font-bold cursor-not-allowed uppercase tracking-wide opacity-70">
                                        Case Closed
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-xl max-w-lg w-full relative">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 text-gray-500 text-lg"
                        >
                            ✕
                        </button>
                        <img
                            src={previewImage}
                            alt="Lost or Found item"
                            className="w-full max-h-[70vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default LostFound;

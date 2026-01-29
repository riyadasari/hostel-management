import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Search, MessageSquare } from 'lucide-react';
import IssueDetailsModal from '../../components/IssueDetailsModal';
import { useAuth } from '../../context/AuthContext';

const IssueManager = () => {
    const [issues, setIssues] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const { profile } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: issuesData, error: issuesError } = await supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            if (issuesError) throw issuesError;

            const { data: staffData, error: staffError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('role', 'staff');

            if (staffError) throw staffError;

            const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('role', 'student');

            if (studentsError) throw studentsError;

            const studentMap = {};
            studentsData.forEach(student => {
                studentMap[student.id] = student.name;
            });

            const mergedIssues = issuesData.map(issue => ({
                ...issue,
                student_name: studentMap[issue.created_by] || 'Unknown'
            }));

            setIssues(mergedIssues);
            setStaffList(staffData);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ===========================
    // STATUS UPDATE (FINAL FIX)
    // ===========================
    const handleStatusChange = async (issueId, newStatus) => {
        try {
            const updates = {
                status: newStatus
            };

            if (newStatus === 'Resolved' || newStatus === 'Closed') {
                updates.resolved_at = new Date().toISOString();
            }

            // ✅ FIRST RESPONSE ONLY
            // We check if it matches 'Assigned' or 'In Progress' and we rely on backend or existing data
            // Since we can't easily see 'responded_at' from 'issue' in this scope without passing it,
            // we will optimistically apply it if it's not set. 
            // Better: 'issues' state has the current issue data.
            const currentIssue = issues.find(i => i.id === issueId);
            if (currentIssue && !currentIssue.responded_at && (newStatus === 'Assigned' || newStatus === 'In Progress')) {
                updates.responded_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('issues')
                .update(updates)
                .eq('id', issueId)
                .select('*')
                .single();

            if (error) {
                console.error('Status update failed:', error);
                alert('Failed to update status');
                return;
            }

            // ✅ Update UI ONLY from DB response
            setIssues(prev =>
                prev.map(issue =>
                    issue.id === issueId ? data : issue
                )
            );

            if (profile?.id) {
                await supabase.from('issue_comments').insert({
                    issue_id: issueId,
                    user_id: profile.id,
                    comment: `System: Status changed to ${newStatus}`,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error(err);
            alert('Unexpected error updating status');
        }
    };

    // ===========================
    // STAFF ASSIGNMENT
    // ===========================
    const handleAssignStaff = async (issueId, staffId) => {
        try {
            const updates = {
                assigned_to: staffId,
                status: 'Assigned'
            };
            
            // ✅ FIRST RESPONSE ONLY
            const currentIssue = issues.find(i => i.id === issueId);
            if (currentIssue && !currentIssue.responded_at) {
                updates.responded_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('issues')
                .update(updates)
                    // 👈 ADD)
                .eq('id', issueId)
                .select('*')
                .single();

            if (error) {
                console.error('Assignment failed:', error);
                alert('Failed to assign staff');
                return;
            }

            setIssues(prev =>
                prev.map(issue =>
                    issue.id === issueId ? data : issue
                )
            );

            if (profile?.id) {
                await supabase.from('issue_comments').insert({
                    issue_id: issueId,
                    user_id: profile.id,
                    comment: 'System: Issue assigned to staff',
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'bg-yellow-100 text-yellow-800';
            case 'Assigned': return 'bg-orange-100 text-orange-800';
            case 'In Progress': return 'bg-purple-100 text-purple-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredIssues = issues.filter(issue => {
        const matchesSearch =
            issue.title?.toLowerCase().includes(search.toLowerCase()) ||
            issue.hostel?.toLowerCase().includes(search.toLowerCase()) ||
            issue.student_name?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' || issue.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading issues...</div>;
    }

    return (
        <div className="pb-10">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold">Issue Manager</h1>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            className="pl-9 pr-4 py-2 border rounded-lg"
                            placeholder="Search issues..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="border px-3 py-2 rounded-lg"
                    >
                        <option value="all">All Status</option>
                        <option value="Reported">Reported</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4">Issue</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Image</th>

                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredIssues.map(issue => (
                            <tr key={issue.id} className="border-t">

                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{issue.title}</span>
                                        <button onClick={() => setSelectedIssueId(issue.id)}>
                                            <MessageSquare className="w-4 h-4 text-orange-500" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">{issue.category}</p>
                                </td>

                                <td className="px-6 py-4 font-medium">{issue.student_name}</td>
                                <td className="px-6 py-4">{issue.hostel} - {issue.room}</td>
                                <td className="px-6 py-4">{issue.priority}</td>

                                <td className="px-6 py-4">
                                    <select
                                        value={issue.status}
                                        disabled={!issue.assigned_to}
                                        onChange={e => handleStatusChange(issue.id, e.target.value)}
                                        className={`px-3 py-1 rounded ${getStatusColor(issue.status)}`}
                                    >
                                        <option value="Reported">Reported</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </td>

                                <td className="px-6 py-4">
                                    <select
                                        value={issue.assigned_to || ''}
                                        onChange={e => handleAssignStaff(issue.id, e.target.value)}
                                        className="border px-3 py-1 rounded"
                                    >
                                        <option value="" disabled>Assign staff</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {issue.media_urls && issue.media_urls.length > 0 ? (
                                        <button
                                            onClick={() => setPreviewImage(issue.media_urls[0])}
                                            className="text-orange-600 font-semibold text-sm hover:underline"
                                        >
                                            View
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-sm">No Image</span>
                                    )}
                                </td>


                                <td className="px-6 py-4 text-xs">
                                    {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedIssueId && (
                <IssueDetailsModal
                    issueId={selectedIssueId}
                    isOpen={true}
                    onClose={() => setSelectedIssueId(null)}
                />
            )}

            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-xl p-4 max-w-4xl w-full relative">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
                        >
                            ✕
                        </button>

                        <img
                            src={previewImage}
                            alt="Issue"
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default IssueManager;

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Bell, Settings } from 'lucide-react';

const Profile = () => {
    const { profile } = useAuth();
    const roleCapitalized = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User';

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full mx-auto flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                            <span className="text-3xl font-bold text-orange-600">
                                {profile?.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'User Name'}</h2>
                        <p className="text-sm text-gray-500 mb-4">{roleCapitalized}</p>

                        <div className="w-full bg-orange-50 text-orange-700 py-2 rounded-lg text-sm font-medium">
                            Active Account
                        </div>
                    </div>
                </div>

                {/* Details & Settings */}
                <div className="md:col-span-2 space-y-6">
                    {/* Access Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-gray-400" />
                            Account Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {profile?.name}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {/* Supabase auth user email is often separate, showing simple placeholder if not in profile */}
                                    {profile?.email || 'user@example.com'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">System Role</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                                    <Shield className="w-4 h-4 text-gray-400" />
                                    {roleCapitalized} Access
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Dummy */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Preferences
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                        <p className="text-xs text-gray-500">Receive daily summaries</p>
                                    </div>
                                </div>
                                <div className="w-10 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
    const { user, profile, loading } = useAuth();

    // 1. Auth Loading or Profile Loading (if user exists)
    // If we have a user but no profile yet, we MUST wait, otherwise we false-redirect.
    if (loading || (user && !profile)) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-50 flex-col gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 text-xs font-mono">Verifying Access...</p>
            </div>
        );
    }

    // 2. No User (and not loading) -> Redirect
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Unauthorized Role -> Redirect
    if (profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    // 4. Authorized
    return <Outlet />;
};

export default RoleRoute;

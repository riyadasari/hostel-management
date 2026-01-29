import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/login';
import Signup from './pages/signup';
import SimpleProtectedRoute from './components/SimpleProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardLayout from './layout/DashboardLayout';
import StudentDashboardHome from './pages/student/DashboardHome';
import MyComplaints from './pages/student/MyComplaints';
import CommunityFeed from './pages/student/CommunityFeed';
import LostFound from './pages/student/LostFound';
import Announcements from './pages/student/Announcements';
import ManagementLayout from './layout/ManagementLayout';
import Overview from './pages/management/Overview';
import IssueManager from './pages/management/IssueManager';
import ManagementAnnouncements from './pages/management/ManagementAnnouncements';
import StaffLayout from './layout/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import Profile from './pages/common/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* PROTECTED ROUTES */}
          <Route element={<SimpleProtectedRoute />}>

            {/* STUDENT ROUTES */}
            <Route element={<RoleRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<DashboardLayout />}>
                <Route index element={<StudentDashboardHome />} />
                <Route path="complaints" element={<MyComplaints />} />
                <Route path="feed" element={<CommunityFeed />} />
                <Route path="lost-found" element={<LostFound />} />
                <Route path="announcements" element={<Announcements />} />
              </Route>
            </Route>

            {/* STAFF ROUTES */}
            <Route element={<RoleRoute allowedRoles={['staff']} />}>
              <Route path="/staff" element={<StaffLayout />}>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route index element={<StaffDashboard />} />
              </Route>
            </Route>

            {/* MANAGEMENT ROUTES */}
            <Route element={<RoleRoute allowedRoles={['management']} />}>
              <Route path="/management" element={<ManagementLayout />}>
                <Route path="overview" element={<Overview />} />
                <Route path="issues" element={<IssueManager />} />
                <Route path="announcements" element={<ManagementAnnouncements />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

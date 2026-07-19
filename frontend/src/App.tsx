/**
 * App.tsx
 * 
 * Root routing configuration for BurnoutGuard.
 * 
 * WHY role-based routing:
 * Different user roles see entirely different parts of the application.
 * A Developer should never accidentally reach the HR analytics dashboard.
 * We enforce this on the frontend for UX and on the backend via RBAC middleware
 * for true security (frontend routing can always be bypassed).
 * 
 * Route structure:
 * /login, /register — public, no auth required
 * / (protected) — RoleRouter redirects to the correct dashboard
 * /developer/* — Developer-specific pages
 * /manager/*   — Manager-specific pages
 * /hr/*        — HR Officer pages
 * /admin/*     — Admin / Research Admin pages
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Public Pages (auth subfolder)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Developer Pages
import DevDashboard from './pages/developer/Dashboard';
import CheckIn from './pages/developer/CheckIn';
import RiskView from './pages/developer/RiskView';
import Recommendations from './pages/developer/Recommendations';
import WeeklyReport from './pages/developer/WeeklyReport';
import Explanation from './pages/developer/Explanation';
import WhatIfSimulator from './pages/developer/WhatIfSimulator';
import Profile from './pages/developer/Profile';

// Manager Pages
import TeamDashboard from './pages/manager/TeamDashboard';
import SprintRisk from './pages/manager/SprintRisk';

// HR Pages
import DepartmentOverview from './pages/hr/DepartmentOverview';
import Trends from './pages/hr/Trends';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import ModelManagement from './pages/admin/ModelManagement';
import AuditLogs from './pages/admin/AuditLogs';

/**
 * RoleRouter: After login, redirects users to their role-appropriate homepage.
 * WHY: A single "/" route that adapts to role is more maintainable than
 * having the login page decide where to redirect.
 */
const RoleRouter = () => {
  const { role } = useAuth();
  switch (role) {
    case 'Manager':     return <Navigate to="/manager/dashboard" replace />;
    case 'HRofficer':  return <Navigate to="/hr/department-overview" replace />;
    case 'Admin':
    case 'ResearchAdmin': return <Navigate to="/admin/users" replace />;
    case 'Developer':
    default:            return <Navigate to="/developer/dashboard" replace />;
  }
};

function App() {
  return (
    <Routes>
      {/* ─── Public Routes ──────────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ─── Protected Routes (require JWT token) ────────────────────── */}
      <Route element={<ProtectedRoute />}>
        {/* Root path → redirect to correct dashboard based on role */}
        <Route path="/" element={<RoleRouter />} />

        {/* Developer routes */}
        <Route path="/developer/dashboard" element={<DevDashboard />} />
        <Route path="/developer/check-in" element={<CheckIn />} />
        <Route path="/developer/my-risk" element={<RiskView />} />
        <Route path="/developer/recommendations" element={<Recommendations />} />
        <Route path="/developer/reports" element={<WeeklyReport />} />
        <Route path="/developer/explanation" element={<Explanation />} />
        <Route path="/developer/what-if" element={<WhatIfSimulator />} />
        <Route path="/developer/profile" element={<Profile />} />

        {/* Manager routes */}
        <Route path="/manager/dashboard" element={<TeamDashboard />} />
        <Route path="/manager/sprint-risk" element={<SprintRisk />} />

        {/* HR routes */}
        <Route path="/hr/department-overview" element={<DepartmentOverview />} />
        <Route path="/hr/trends" element={<Trends />} />

        {/* Admin routes */}
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/models" element={<ModelManagement />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback: redirect unknown URLs back to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

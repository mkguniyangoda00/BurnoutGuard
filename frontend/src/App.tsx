/**
 * App.tsx
 *
 * Root routing configuration for BurnoutGuard.
 *
 * Route structure:
 * /login, /register - public
 * / - public landing that sends users to login
 * /developer/* - Developer pages
 * /manager/* - Manager pages
 * /hr/* - HR pages
 * /admin/* - Admin pages
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import WellnessResources from './pages/WellnessResources';

import DevDashboard from './pages/developer/Dashboard';
import CheckIn from './pages/developer/CheckIn';
import RiskView from './pages/developer/RiskView';
import Recommendations from './pages/developer/Recommendations';
import WeeklyReport from './pages/developer/WeeklyReport';
import Explanation from './pages/developer/Explanation';
import WhatIfSimulator from './pages/developer/WhatIfSimulator';
import Profile from './pages/developer/Profile';
import Journal from './pages/developer/Journal';

import TeamDashboard from './pages/manager/TeamDashboard';
import SprintRisk from './pages/manager/SprintRisk';

import DepartmentOverview from './pages/hr/DepartmentOverview';
import Trends from './pages/hr/Trends';

import UserManagement from './pages/admin/UserManagement';
import ModelManagement from './pages/admin/ModelManagement';
import FactorAnalysis from './pages/admin/FactorAnalysis';
import AuditLogs from './pages/admin/AuditLogs';
import Survey from './pages/admin/Survey';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/wellness-resources" element={<WellnessResources />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/developer/dashboard" element={<DevDashboard />} />
        <Route path="/developer/check-in" element={<CheckIn />} />
        <Route path="/developer/my-risk" element={<RiskView />} />
        <Route path="/developer/recommendations" element={<Recommendations />} />
        <Route path="/developer/reports" element={<WeeklyReport />} />
        <Route path="/developer/explanation" element={<Explanation />} />
        <Route path="/developer/what-if" element={<WhatIfSimulator />} />
        <Route path="/developer/profile" element={<Profile />} />
        <Route path="/developer/journal" element={<Journal />} />

        <Route path="/manager/dashboard" element={<TeamDashboard />} />
        <Route path="/manager/sprint-risk" element={<SprintRisk />} />
        <Route path="/manager/profile" element={<Profile />} />

        <Route path="/hr/department-overview" element={<DepartmentOverview />} />
        <Route path="/hr/trends" element={<Trends />} />
        <Route path="/hr/profile" element={<Profile />} />

        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/models" element={<ModelManagement />} />
        <Route path="/admin/factor-analysis" element={<FactorAnalysis />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/profile" element={<Profile />} />
        <Route path="/admin/survey" element={<Survey />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

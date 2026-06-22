import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, type Role } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Developer Pages
import Dashboard from './pages/developer/Dashboard';
import CheckIn from './pages/developer/CheckIn';
import Explanation from './pages/developer/Explanation';
import Recommendations from './pages/developer/Recommendations';
import WeeklyReport from './pages/developer/WeeklyReport';
import Profile from './pages/developer/Profile';
import RiskView from './pages/developer/RiskView';
import WhatIfSimulator from './pages/developer/WhatIfSimulator';

// Manager Pages
import TeamDashboard from './pages/manager/TeamDashboard';
import SprintRisk from './pages/manager/SprintRisk';

// HR Pages
import DepartmentOverview from './pages/hr/DepartmentOverview';
import Trends from './pages/hr/Trends';

// Admin Pages
import ResearchAdmin from './pages/admin/ModelManagement';
import AuditLogs from './pages/admin/AuditLogs';
import FairnessReport from './pages/admin/FairnessReport';
import UserManagement from './pages/admin/UserManagement';
import DatasetExport from './pages/admin/DatasetExport';
import Survey from './pages/admin/Survey';

import './styles/index.css';

// Component to protect routes based on authentication and optionally role
const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If they go to a route they don't have access to, send them to their dashboard
    if (role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    if (role === 'hr') return <Navigate to="/hr/department-overview" replace />;
    if (role === 'admin' || role === 'research_admin') return <Navigate to="/admin/models" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

          {/* Developer Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['developer']}><Dashboard /></ProtectedRoute>} />
          <Route path="/check-in" element={<ProtectedRoute allowedRoles={['developer']}><CheckIn /></ProtectedRoute>} />
          <Route path="/my-risk" element={<ProtectedRoute allowedRoles={['developer']}><RiskView /></ProtectedRoute>} />
          <Route path="/shap-insights" element={<ProtectedRoute allowedRoles={['developer']}><Explanation /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute allowedRoles={['developer']}><Recommendations /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['developer']}><WeeklyReport /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute allowedRoles={['developer']}><WhatIfSimulator /></ProtectedRoute>} />

          {/* Manager Routes */}
          <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><TeamDashboard /></ProtectedRoute>} />
          <Route path="/manager/sprint-risk" element={<ProtectedRoute allowedRoles={['manager']}><SprintRisk /></ProtectedRoute>} />

          {/* HR Routes */}
          <Route path="/hr/department-overview" element={<ProtectedRoute allowedRoles={['hr']}><DepartmentOverview /></ProtectedRoute>} />
          <Route path="/hr/trends" element={<ProtectedRoute allowedRoles={['hr']}><Trends /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/models" element={<ProtectedRoute allowedRoles={['admin', 'research_admin']}><ResearchAdmin /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/fairness-report" element={<ProtectedRoute allowedRoles={['admin', 'research_admin']}><FairnessReport /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/datasets" element={<ProtectedRoute allowedRoles={['admin', 'research_admin']}><DatasetExport /></ProtectedRoute>} />
          <Route path="/admin/survey" element={<ProtectedRoute allowedRoles={['research_admin']}><Survey /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

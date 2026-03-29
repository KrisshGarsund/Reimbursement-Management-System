import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ExpenseDetailPage from './pages/ExpenseDetailPage.jsx';
import UserManagement from './pages/UserManagement.jsx';
import ApprovalRules from './pages/ApprovalRules.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to role-appropriate dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/expenses" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/expenses" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Employee routes */}
          <Route path="/expenses" element={<EmployeeDashboard />} />
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />

          {/* Manager routes */}
          <Route path="/manager" element={<ProtectedRoute roles={['MANAGER', 'ADMIN']}><ManagerDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/rules" element={<ProtectedRoute roles={['ADMIN']}><ApprovalRules /></ProtectedRoute>} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

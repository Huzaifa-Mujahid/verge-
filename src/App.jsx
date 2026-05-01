import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Meetings from './pages/Meetings';
import Payments from './pages/Payments';
import Interactions from './pages/Interactions';
import Reports from './pages/Reports';
import ClientDetail from './pages/ClientDetail';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />

          <Route path="/meetings" element={
            <ProtectedRoute>
              <Meetings />
            </ProtectedRoute>
          } />

          <Route path="/interactions" element={
            <ProtectedRoute>
              <Interactions />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/clients/:id" element={
            <ProtectedRoute>
              <ClientDetail />
            </ProtectedRoute>
          } />

          {/* Placeholder for other routes */}
          <Route path="*" element={<ProtectedRoute>
            <div className="p-10 text-center">
              <h1 className="text-2xl font-bold">Coming Soon</h1>
              <p className="text-slate-500">This feature is being ported from the Blazor version.</p>
            </div>
          </ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

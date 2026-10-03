import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AndroidProvider } from './context/AndroidContext';
import AndroidDeviceFrame from './components/AndroidDeviceFrame';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import SavingsGoals from './pages/SavingsGoals';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AndroidProvider>
      <AuthProvider>
        <BrowserRouter>
          <AndroidDeviceFrame>
            <Routes>
              {/* Public Landing & Auth */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Dashboard Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/savings-goals" element={<SavingsGoals />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AndroidDeviceFrame>
        </BrowserRouter>
      </AuthProvider>
    </AndroidProvider>
  );
}

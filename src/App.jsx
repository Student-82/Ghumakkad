import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx'; // Make sure this path is correct
import SignUp from './pages/SignUp.jsx'; // Make sure this path is correct
import Dashboard from './pages/Dashboard.jsx'; // Make sure this path is correct
import PrivateRoute from './components/PrivateRoute.jsx'; // We will create this next

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Private Routes */}
      {/* We will wrap the dashboard in a PrivateRoute to protect it */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

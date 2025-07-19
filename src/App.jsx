import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Make sure this path is correct

import Login from './pages/Login.jsx';
// FIXED: Changed SignUp.jsx to Signup.jsx to match potential filename case sensitivity issues on deployment.
// Please ensure your file in src/pages/ is named exactly "Signup.jsx"
import SignUp from './pages/Signup.jsx'; 
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; 
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      <Route 
        path="/dashboard" 
        element={
          session ? <Dashboard session={session} /> : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting session:", error);
            }
            setSession(data.session);
            setLoading(false);
        };

        getSession();

        // Listen for auth changes to update the session state
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            // Cleanup the listener when the component unmounts
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        // You can show a loading spinner here if you want
        return null; 
    }

    // If there is a valid session, render the children (e.g., the Dashboard)
    // Otherwise, redirect to the login page
    return session ? children : <Navigate to="/login" />;
};

export default PrivateRoute;

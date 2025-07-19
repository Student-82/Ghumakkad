import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

// Import your page components
import MyTrips from './MyTrips.jsx'; 
import Profile from './Profile.jsx';
import Deals from './Deals.jsx';
import Blueprints from './Blueprints.jsx';
import StudentGuides from './StudentGuides.jsx';
import CertifiedStays from './CertifiedStays.jsx';
import CampusAmbassador from './CampusAmbassador.jsx';

const Dashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('main'); // 'main' or 'profile'

    useEffect(() => {
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting session:", error);
            }
            setSession(session);
            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return (
            <div className="aurora-background flex items-center justify-center min-h-screen">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        );
    }
    
    if (session) {
        const userInitial = session.user.email ? session.user.email.charAt(0).toUpperCase() : '?';

        return (
            <div className="aurora-background p-4 md:p-8 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <header className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-lg shadow-lg mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, Traveler!</h1>
                                <p className="text-sm text-gray-500">Logged in as: <strong>{session.user.email}</strong></p>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 mt-4 md:mt-0">
                                <div 
                                    onClick={() => setView('profile')} 
                                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full font-bold text-lg cursor-pointer hover:bg-indigo-700 transition"
                                    title="View Profile"
                                >
                                    {userInitial}
                                </div>
                                <button onClick={handleLogout} className="font-bold py-2 px-4 text-sm md:text-base text-white bg-red-500 rounded-full hover:bg-red-600 transition">
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-8">
                        {view === 'main' ? (
                            <>
                                <MyTrips /> 
                                <StudentGuides />
                                <CertifiedStays />
                                <CampusAmbassador />
                                <Deals />
                                <Blueprints />
                            </>
                        ) : (
                            <Profile setView={setView} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default Dashboard;

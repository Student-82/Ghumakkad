// FILE: src/pages/TripInvite.jsx (NEW FILE)
// This is the public page a user sees when they click an invite link.

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Login from './Login'; // We'll reuse the login component

export default function TripInvite({ tripId }) {
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTripInfo = async () => {
            setLoading(true);
            try {
                // This is a public query, so we need a specific policy for it.
                // We'll add this in the next step.
                const { data, error } = await supabase
                    .from('trips')
                    .select('title, destination, pact_amount')
                    .eq('id', tripId)
                    .single();

                if (error) throw error;
                setTrip(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTripInfo();
    }, [tripId]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Invitation...</div>;
    }

    if (error || !trip) {
        return <div className="flex justify-center items-center min-h-screen">Error: Invalid or expired invitation link.</div>;
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="text-center mb-8 max-w-lg">
                <h1 className="text-3xl font-bold text-[#073B4C]">You're Invited!</h1>
                <p className="text-lg text-gray-600 mt-2">You've been invited to join the trip:</p>
                <div className="bg-white p-6 rounded-lg shadow-lg mt-4">
                    <h2 className="text-2xl font-bold text-[#118AB2]">{trip.title}</h2>
                    <p className="text-gray-500">{trip.destination}</p>
                    {trip.pact_amount > 0 && (
                        <p className="mt-4 text-lg">Pact Amount: <span className="font-bold text-green-600">₹{trip.pact_amount}</span></p>
                    )}
                </div>
                <p className="text-gray-600 mt-6">Please log in or sign up to accept the invitation and join the pact.</p>
            </div>
            
            {/* We reuse the existing Login component for the auth flow */}
            <div className="w-full max-w-md">
                 <Login />
            </div>
        </div>
    );
}

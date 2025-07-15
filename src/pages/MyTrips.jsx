// FILE: src/pages/MyTrips.jsx (FINAL VERSION)
// This version re-enables the TripDetail view.

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import TripDetail from './TripDetail.jsx';

const CreateTripForm = ({ onTripCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState(null);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('create_new_trip', {
        p_title: title,
        p_destination: destination,
      });
      if (error) throw error;
      onTripCreated();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#073B4C] mb-6">Plan a New Adventure</h2>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Trip Name</label>
            <input id="title" type="text" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Spiti Valley Expedition" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
            <input id="destination" type="text" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Himachal Pradesh" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" className="bg-[#06D6A0] text-white font-bold py-2 px-6 rounded-full hover:bg-[#05b386] transition" disabled={loading}>{loading ? 'Creating...' : 'Create Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function MyTrips({ session }) {
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null); // Re-enabled

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('trips').select(`id, title, destination, trip_members(user_id)`);
            if (error) throw error;
            setTrips(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    // Re-enabled clicking into a trip
    if (selectedTrip) {
        return <TripDetail trip={selectedTrip} session={session} onBack={() => setSelectedTrip(null)} />;
    }

    if (loading) return <p className="text-center text-gray-500">Loading your trips...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#073B4C] mb-4 md:mb-0">My Trips</h2>
                <button onClick={() => setShowCreateForm(true)} className="bg-[#118AB2] text-white font-bold py-2 px-6 rounded-full hover:bg-[#0e7694] transition shadow-lg w-full md:w-auto">+ Create New Trip</button>
            </div>

            {trips.length === 0 ? (
                <div className="text-center border-2 border-dashed border-gray-300 p-8 rounded-lg">
                    <p className="text-gray-500">You haven't planned any trips yet. Start your next adventure!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                        // Re-enabled the onClick handler
                        <div key={trip.id} onClick={() => setSelectedTrip(trip)} className="bg-gray-50 rounded-lg p-6 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200">
                            <h3 className="text-xl font-bold text-[#073B4C] truncate">{trip.title}</h3>
                            <p className="text-gray-500 mb-4">{trip.destination}</p>
                            <div className="flex items-center text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                                <span>{trip.trip_members.length} Member(s)</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {showCreateForm && (
                <CreateTripForm onCancel={() => setShowCreateForm(false)} onTripCreated={() => { setShowCreateForm(false); fetchTrips(); }} />
            )}
        </div>
    );
}

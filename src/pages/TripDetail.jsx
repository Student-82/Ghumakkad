// FILE: src/pages/TripDetail.jsx (UPDATED WITH FINAL FIX)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AddItineraryItemForm = ({ trip, session }) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        // The insert itself is fine. The subscription will handle the update.
        await supabase.from('itinerary_items').insert({ trip_id: trip.id, user_id: session.user.id, title: title });
        setTitle('');
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-4">
            <input type="text" placeholder="e.g., Visit Baga Beach" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
            <button type="submit" className="bg-[#06D6A0] text-white font-bold py-2 px-4 rounded-md w-full sm:w-auto" disabled={loading}>{loading ? '...' : 'Add'}</button>
        </form>
    );
};

const AddExpenseForm = ({ trip, session }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim() || !amount) return;
        setLoading(true);
        await supabase.from('expenses').insert({ trip_id: trip.id, paid_by_user_id: session.user.id, description: description, amount: parseFloat(amount) });
        setDescription('');
        setAmount('');
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-4">
            <input type="text" placeholder="e.g., Taxi fare" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
            <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
            <button type="submit" className="bg-[#06D6A0] text-white font-bold py-2 px-4 rounded-md w-full sm:w-auto" disabled={loading}>{loading ? '...' : 'Add'}</button>
        </form>
    );
};


export default function TripDetail({ trip, session, onBack }) {
    const [itineraryItems, setItineraryItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This function will now be our single source of truth for fetching data.
    const fetchTripDetails = async () => {
        try {
            const { data: membersData, error: membersError } = await supabase.from('trip_members').select('user_id').eq('trip_id', trip.id);
            if (membersError) throw membersError;
            const memberIds = membersData.map(m => m.user_id);

            const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, email').in('id', memberIds);
            if (profilesError) throw profilesError;
            const profilesMap = profilesData.reduce((acc, profile) => { acc[profile.id] = profile.email; return acc; }, {});
            setProfiles(profilesMap);

            const itineraryPromise = supabase.from('itinerary_items').select('*').eq('trip_id', trip.id).order('created_at', { ascending: true });
            const expensesPromise = supabase.from('expenses').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false });
            
            const [{ data: itineraryData, error: itineraryError }, { data: expensesData, error: expensesError }] = await Promise.all([itineraryPromise, expensesPromise]);
            if (itineraryError) throw itineraryError;
            if (expensesError) throw expensesError;

            setItineraryItems(itineraryData);
            setExpenses(expensesData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initial data when the component mounts
        fetchTripDetails();

        // Set up the real-time subscription.
        // When a new item is inserted, we don't use the payload.
        // We just call our fetchTripDetails function again to get the latest data.
        const subscription = supabase.channel(`trip_updates_for_${trip.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${trip.id}` }, () => {
                fetchTripDetails();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses', filter: `trip_id=eq.${trip.id}` }, () => {
                fetchTripDetails();
            })
            .subscribe();

        // Cleanup function to remove the subscription
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [trip.id]);

    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

    if (loading) return <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg"><p className="text-center text-gray-500">Loading trip details...</p></div>;
    if (error) return <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg"><p className="text-center text-red-500">Error: {error}</p></div>;

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold p-2 rounded-full hover:bg-gray-300 transition mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="flex-grow">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#073B4C] truncate">{trip.title}</h2>
                    <p className="text-gray-500">{trip.destination}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#073B4C] mb-4">Itinerary</h3>
                    {itineraryItems.length === 0 ? (<p className="text-gray-500">No itinerary items added yet.</p>) : (<ul className="space-y-3">{itineraryItems.map(item => (<li key={item.id} className="bg-white p-3 rounded-md shadow-sm flex items-center"><span className="w-2 h-2 bg-[#118AB2] rounded-full mr-3"></span>{item.title}</li>))}</ul>)}
                    <AddItineraryItemForm trip={trip} session={session} />
                </div>
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h3 className="text-xl font-bold text-[#073B4C] mb-2 sm:mb-0">Expenses</h3>
                        <span className="text-lg font-bold text-green-600">Total: ₹{totalExpenses.toFixed(2)}</span>
                    </div>
                    {expenses.length === 0 ? (<p className="text-gray-500">No expenses tracked yet.</p>) : (<ul className="space-y-3">{expenses.map(expense => (<li key={expense.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between"><div className="truncate pr-2"><p className="font-semibold truncate">{expense.description}</p><p className="text-xs text-gray-500">Paid by: {profiles[expense.paid_by_user_id] || '...'}</p></div><span className="font-bold whitespace-nowrap">₹{expense.amount}</span></li>))}</ul>)}
                    <AddExpenseForm trip={trip} session={session} />
                </div>
            </div>
        </div>
    );
}
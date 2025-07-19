// FILE: src/pages/TripDetail.jsx (UPDATED)
// This file now includes the Invite Friends UI and Wallet display.

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AddItineraryItemForm = ({ trip, session }) => { /* ... (no changes) ... */ };
const AddExpenseForm = ({ trip, session }) => { /* ... (no changes) ... */ };

export default function TripDetail({ trip, session, onBack }) {
    const [itineraryItems, setItineraryItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const inviteLink = `${window.location.origin}/invite/${trip.id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        });
    };

    const fetchTripDetails = async () => {
        // ... (data fetching logic remains the same)
    };

    useEffect(() => {
        const fetchAndSubscribe = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch initial data
                const membersPromise = supabase.from('trip_members').select('status, profiles(id, email, username)').eq('trip_id', trip.id);
                const walletPromise = supabase.from('trip_wallet_transactions').select('amount, type').eq('trip_id', trip.id);
                const itineraryPromise = supabase.from('itinerary_items').select('*').eq('trip_id', trip.id).order('created_at', { ascending: true });
                const expensesPromise = supabase.from('expenses').select('*, profiles(email)').eq('trip_id', trip.id).order('created_at', { ascending: false });

                const [ {data: membersData, error: membersError}, {data: walletData, error: walletError}, {data: itineraryData, error: itineraryError}, {data: expensesData, error: expensesError} ] = await Promise.all([membersPromise, walletPromise, itineraryPromise, expensesPromise]);
                
                if (membersError) throw membersError;
                if (walletError) throw walletError;
                if (itineraryError) throw itineraryError;
                if (expensesError) throw expensesError;

                setMembers(membersData);
                setItineraryItems(itineraryData);
                setExpenses(expensesData);
                
                const balance = walletData.reduce((acc, curr) => curr.type === 'pledge' ? acc + curr.amount : acc - curr.amount, 0);
                setWalletBalance(balance);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAndSubscribe();

        // Real-time subscriptions
        const subscription = supabase.channel(`trip_updates_for_${trip.id}`)
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                fetchAndSubscribe(); // Refetch all data on any change
            })
            .subscribe();

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Itinerary & Expenses */}
                <div className="lg:col-span-2 space-y-8">
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
                        {expenses.length === 0 ? (<p className="text-gray-500">No expenses tracked yet.</p>) : (<ul className="space-y-3">{expenses.map(expense => (<li key={expense.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between"><div className="truncate pr-2"><p className="font-semibold truncate">{expense.description}</p><p className="text-xs text-gray-500">Paid by: {expense.profiles?.email || '...'}</p></div><span className="font-bold whitespace-nowrap">₹{expense.amount}</span></li>))}</ul>)}
                        <AddExpenseForm trip={trip} session={session} />
                    </div>
                </div>
                {/* Right Column: Members & Wallet */}
                <div className="lg:col-span-1 bg-gray-50 p-4 md:p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#073B4C] mb-4">Members & Wallet</h3>
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center mb-6">
                        <p className="font-bold text-lg">Trip Wallet Balance</p>
                        <p className="text-3xl font-black">₹{walletBalance.toFixed(2)}</p>
                    </div>
                    <h4 className="font-bold text-gray-700 mb-2">Members ({members.length})</h4>
                    <ul className="space-y-2 mb-6">
                        {members.map(member => (
                            <li key={member.profiles.id} className="flex items-center justify-between bg-white p-2 rounded-md">
                                <span className="text-sm truncate">{member.profiles.email || member.profiles.id}</span>
                                <span className={`text-xs font-bold py-1 px-2 rounded-full ${member.status === 'pledged' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{member.status}</span>
                            </li>
                        ))}
                    </ul>
                    <h4 className="font-bold text-gray-700 mb-2">Invite Friends</h4>
                    <p className="text-xs text-gray-500 mb-2">Share this link with your friends to invite them to the trip pact.</p>
                    <div className="relative">
                        <input type="text" readOnly value={inviteLink} className="w-full bg-white border border-gray-300 rounded-md p-2 pr-10 text-sm" />
                        <button onClick={copyToClipboard} className="absolute inset-y-0 right-0 px-3 flex items-center bg-gray-200 rounded-r-md hover:bg-gray-300">
                            {copied ? '✓' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


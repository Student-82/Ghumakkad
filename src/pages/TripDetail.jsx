import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// --- Helper Components ---

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-lg w-full relative">
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            {children}
        </div>
    </div>
);

const Spinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

// --- Main Trip Detail Component ---

const TripDetail = ({ tripId, setView, userId }) => {
    const [trip, setTrip] = useState(null);
    const [itinerary, setItinerary] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [memberProfiles, setMemberProfiles] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showItineraryModal, setShowItineraryModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [isPledging, setIsPledging] = useState(false);

    useEffect(() => {
        if (!tripId) return;
        
        const fetchAllData = async () => {
            setLoading(true);
            const { data: tripData, error: tripError } = await supabase.from('trips').select('*').eq('id', tripId).single();
            if (tripError) { 
                console.error("Error fetching trip:", tripError.message);
                setLoading(false); 
                return; 
            }
            setTrip(tripData);

            const [itineraryRes, expensesRes, transactionsRes, profilesRes, budgetsRes] = await Promise.all([
                supabase.from('itinerary').select('*').eq('trip_id', tripId).order('date', { ascending: true }),
                supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
                supabase.from('trip_wallet_transactions').select('*').eq('trip_id', tripId),
                supabase.from('profiles').select('id, email, upi_id').in('id', tripData.members),
                supabase.from('budgets').select('*').eq('trip_id', tripId)
            ]);
            
            setItinerary(itineraryRes.data || []);
            setExpenses(expensesRes.data || []);
            setTransactions(transactionsRes.data || []);
            setMemberProfiles(profilesRes.data || []);
            setBudgets(budgetsRes.data || []);
            setLoading(false);
        };
        
        fetchAllData();

        const channel = supabase.channel(`trip-details-${tripId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, () => fetchAllData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId]);
    
    const handlePledge = async () => {
        setIsPledging(true);
        const newMembers = [...trip.members, userId];
        
        const { error: memberError } = await supabase.from('trips').update({ members: newMembers }).eq('id', tripId);
        
        if (memberError) {
            alert(`Error joining trip: ${memberError.message}`);
            setIsPledging(false);
            return;
        }

        const { error: transactionError } = await supabase.from('trip_wallet_transactions').insert({ trip_id: tripId, user_id: userId, transaction_type: 'pledge', amount: trip.pact_amount });

        if (transactionError) {
            alert(`Error adding pledge: ${transactionError.message}`);
        } else {
            alert("Success! You have joined the trip.");
        }
        setIsPledging(false);
    };

    const copyTripId = () => {
        navigator.clipboard.writeText(tripId);
        alert("Trip ID copied to clipboard!");
    };
    
    const addItineraryItem = async (item) => {
        await supabase.from('itinerary').insert([{ ...item, trip_id: tripId }]);
        setShowItineraryModal(false);
    };
    
    const addExpenseItem = async (item, billFile) => {
        let bill_url = null;
        if (billFile) {
            const fileName = `${userId}/${tripId}/${Date.now()}_${billFile.name}`;
            const { data, error } = await supabase.storage.from('bills').upload(fileName, billFile);
            if (error) {
                console.error('Error uploading bill:', error);
            } else {
                const { data: { publicUrl } } = supabase.storage.from('bills').getPublicUrl(fileName);
                bill_url = publicUrl;
            }
        }

        await supabase.from('expenses').insert([{ 
            ...item, 
            bill_url,
            trip_id: tripId, 
            paid_by: userId 
        }]);
        setShowExpenseModal(false);
    };

    if (loading) return <Spinner />;
    if (!trip) return <p>Trip not found.</p>;

    const isMember = trip.members.includes(userId);
    const isCreator = trip.creator_id === userId;
    const pledgedUserIds = transactions.filter(t => t.transaction_type === 'pledge').map(t => t.user_id);
    const totalPledged = transactions.filter(t => t.transaction_type === 'pledge').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <button onClick={() => setView('tripList')} className="text-indigo-600 font-semibold mb-4 inline-block">&larr; Back to Trips</button>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{trip.title}</h2>
                    <p className="text-lg text-gray-600">{trip.destination}</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    {isCreator && (
                        <button onClick={() => setShowBudgetModal(true)} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 text-sm">Manage Budget</button>
                    )}
                    <button onClick={copyTripId} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 text-sm">Share Trip ID</button>
                </div>
            </div>
            
            <div className="mb-8 p-6 bg-indigo-50 rounded-xl">
                <h3 className="text-2xl font-bold text-indigo-800 mb-4">Trip Pact & Wallet</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <p className="text-sm font-bold text-gray-500">PACT AMOUNT</p>
                        <p className="text-4xl font-bold text-indigo-600">₹{trip.pact_amount || 0}</p>
                        <p className="text-sm text-gray-600">This is the amount each member must pledge to join.</p>
                    </div>
                    <div>
                         <p className="text-sm font-bold text-gray-500">WALLET TOTAL</p>
                        <p className="text-4xl font-bold text-green-600">₹{totalPledged}</p>
                        <p className="text-sm text-gray-600">{pledgedUserIds.length} of {trip.members.length} members have pledged.</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-2">MEMBERS</p>
                        <ul className="space-y-2">
                            {trip.members.map(memberId => {
                                const profile = memberProfiles.find(p => p.id === memberId);
                                const email = profile ? profile.email : `User...${memberId.slice(-6)}`;
                                const hasPledged = pledgedUserIds.includes(memberId);

                                return (
                                    <li key={memberId} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{email}</span>
                                        {hasPledged ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold">✅ Pledged</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-yellow-600 font-bold">⌛ Pending</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                {!isMember && trip.pact_amount > 0 && (
                    <div className="mt-6 text-center">
                        <button onClick={handlePledge} disabled={isPledging} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 shadow-lg">
                            {isPledging ? 'Pledging...' : `Pledge ₹${trip.pact_amount} & Join`}
                        </button>
                    </div>
                )}
            </div>
            
            {budgets.length > 0 && (
                <div className="mb-8 p-6 bg-yellow-50 rounded-xl">
                    <h3 className="text-2xl font-bold text-yellow-800 mb-4">Budget Tracker</h3>
                    <div className="space-y-4">
                        {budgets.map(budget => {
                            const spent = expenses
                                .filter(e => e.category === budget.category)
                                .reduce((sum, e) => sum + e.amount, 0);
                            const percentage = (spent / budget.amount) * 100;
                            return (
                                <div key={budget.category}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-gray-700">{budget.category}</span>
                                        <span className="text-sm font-medium text-gray-700">₹{spent.toFixed(0)} / ₹{budget.amount}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-yellow-500 h-2.5 rounded-full" 
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mb-8 p-6 bg-green-50 rounded-xl text-center">
                <h3 className="text-2xl font-bold text-green-800 mb-2">Ready to Settle Up?</h3>
                <p className="text-gray-600 mb-4">Calculate who owes whom based on the trip's expenses.</p>
                <button 
                    onClick={() => setShowSettleModal(true)}
                    className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 shadow-lg"
                >
                    Calculate Balances
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white/50 p-6 rounded-xl shadow-inner lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold">Itinerary</h3>
                        <button onClick={() => setShowItineraryModal(true)} className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-600 text-sm">+ Add</button>
                    </div>
                    <div className="space-y-4">
                        {itinerary.sort((a, b) => new Date(a.date) - new Date(b.date)).map(item => (
                            <div key={item.id} className="p-4 bg-gray-50/80 rounded-lg">
                                <p className="font-bold text-gray-800">{item.activity}</p>
                                <p className="text-sm text-gray-500">{item.date} at {item.time}</p>
                                {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                            </div>
                        ))}
                        {itinerary.length === 0 && <p className="text-gray-500">No itinerary items yet.</p>}
                    </div>
                </div>
                
                <div className="bg-white/50 p-6 rounded-xl shadow-inner lg:col-span-1">
                     <ExpenseFeed expenses={expenses} memberProfiles={memberProfiles} />
                </div>

                <div className="bg-white/50 p-6 rounded-xl shadow-inner lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold">Expenses</h3>
                        <button onClick={() => setShowExpenseModal(true)} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 text-sm">+ Add</button>
                    </div>
                    <div className="space-y-4 mb-4">
                         {expenses.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50/80 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">Paid by: {memberProfiles.find(p => p.id === item.paid_by)?.email.split('@')[0] || '...'}
                                        </p>
                                        <span className="text-xs font-bold text-indigo-700">
                                            {item.split_method === 'you_are_owed' ? '• You are Owed' : '• Split Equally'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {item.bill_url && (
                                        <a href={item.bill_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </a>
                                    )}
                                    <p className="font-bold text-lg text-gray-900">₹{parseFloat(item.amount).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && <p className="text-gray-500">No expenses logged yet.</p>}
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                        <h4 className="text-lg font-bold">Total:</h4>
                        <p className="text-2xl font-extrabold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {showItineraryModal && <Modal onClose={() => setShowItineraryModal(false)}><ItineraryForm onSubmit={addItineraryItem} /></Modal>}
            {showExpenseModal && <Modal onClose={() => setShowExpenseModal(false)}><ExpenseForm onSubmit={addExpenseItem} /></Modal>}
            {showSettleModal && (
                <Modal onClose={() => setShowSettleModal(false)}>
                    <SettlementCalculator 
                        expenses={expenses}
                        pledgedUserIds={pledgedUserIds}
                        memberProfiles={memberProfiles}
                        tripName={trip.title}
                    />
                </Modal>
            )}
            {showBudgetModal && (
                <Modal onClose={() => setShowBudgetModal(false)}>
                    <BudgetForm 
                        tripId={tripId}
                        existingBudgets={budgets}
                        onClose={() => setShowBudgetModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

// ... (SettlementCalculator, ExpenseFeed, ItineraryForm, ExpenseForm, BudgetForm components are here)
// These components are unchanged from the last complete version.
// For brevity, I'm omitting them here, but they are part of the full file.

export default TripDetail;

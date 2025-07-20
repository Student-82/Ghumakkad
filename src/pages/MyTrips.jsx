import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

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


// --- Main Feature Components ---

const TripList = ({ setView, setSelectedTripId, setEditingTrip, userId }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinId, setJoinId] = useState('');
    const [joinError, setJoinError] = useState('');

    useEffect(() => {
        if (!userId) return;

        const fetchTrips = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .contains('members', [userId]); 

            if (error) {
                console.error("Error fetching trips: ", error);
            } else {
                setTrips(data || []);
            }
            setLoading(false);
        };

        fetchTrips();

        const subscription = supabase
            .channel('public:trips')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
                fetchTrips();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [userId]);

    const handleSelectTrip = (tripId) => {
        setSelectedTripId(tripId);
        setView('tripDetail');
    };
    
    const handleJoinTrip = async (e) => {
        e.preventDefault();
        setJoinError('');
        if (!joinId.trim()) return;

        const { data, error } = await supabase
            .from('trips')
            .select('id')
            .eq('id', joinId.trim())
            .single();

        if (error || !data) {
            setJoinError('Invalid Trip ID. Please check the ID and try again.');
        } else {
            setSelectedTripId(data.id);
            setView('tripDetail');
        }
    };

    const handleDeleteTrip = async (tripId) => {
        if (window.confirm("Are you sure you want to permanently delete this trip and all its data?")) {
            const { error } = await supabase.from('trips').delete().eq('id', tripId);
            if (error) {
                alert(`Error deleting trip: ${error.message}`);
            }
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">My Trips</h2>
                <form onSubmit={handleJoinTrip} className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    <input 
                        type="text" 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="Paste Trip ID to Join"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <button type="submit" className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 text-sm">Join</button>
                </form>
                <button onClick={() => setView('createTrip')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md w-full md:w-auto">
                    + Create Trip
                </button>
            </div>
             {joinError && <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-lg mb-4">{joinError}</p>}
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.length > 0 ? trips.map(trip => (
                        <div key={trip.id} className="bg-white p-6 rounded-xl shadow-lg group relative">
                            <div onClick={() => handleSelectTrip(trip.id)} className="cursor-pointer">
                                <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
                                <p className="text-gray-600">{trip.destination}</p>
                                {trip.pact_amount && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-bold text-indigo-600">Pact: ₹{trip.pact_amount}</p>
                                    </div>
                                )}
                            </div>
                            {trip.creator_id === userId && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); }} className="text-blue-500 hover:text-blue-700">✏️</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }} className="text-red-500 hover:text-red-700">🗑️</button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-12 bg-gray-50/50 rounded-lg">
                            <p className="text-gray-500">You have no trips yet. Create or join one to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TripForm = ({ setView, userId, existingTrip }) => {
    const [title, setTitle] = useState(existingTrip?.title || '');
    const [destination, setDestination] = useState(existingTrip?.destination || '');
    const [pactAmount, setPactAmount] = useState(existingTrip?.pact_amount || '');
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = !!existingTrip;

    const handleSaveTrip = async (e) => {
        e.preventDefault();
        if (!title.trim() || !destination.trim() || !userId) return;

        setIsSaving(true);
        const tripData = {
            title,
            destination,
            pact_amount: pactAmount || null,
            creator_id: userId,
            members: existingTrip?.members || [userId]
        };

        if (isEditMode) {
            const { error } = await supabase.from('trips').update(tripData).eq('id', existingTrip.id);
            if (error) console.error("Error updating trip:", error);
        } else {
            const { error } = await supabase.from('trips').insert([tripData]);
            if (error) console.error("Error creating trip:", error);
        }
        
        setIsSaving(false);
        setView('tripList');
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">{isEditMode ? 'Edit Trip' : 'Create a New Trip'}</h2>
            <form onSubmit={handleSaveTrip} className="space-y-6">
                <div>
                    <label htmlFor="trip-title" className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                    <input id="trip-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Rishikesh Adventure" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input id="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Uttarakhand, India" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                    <label htmlFor="pact-amount" className="block text-sm font-medium text-gray-700 mb-1">Pact Amount (₹)</label>
                    <input 
                        id="pact-amount" 
                        type="number" 
                        value={pactAmount} 
                        onChange={(e) => setPactAmount(e.target.value)} 
                        placeholder="e.g., 1000 (Optional)" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">The amount each member must pledge to join the trip.</p>
                </div>
                <div className="flex justify-end gap-4">
                     <button type="button" onClick={() => setView('tripList')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300">
                        {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Trip')}
                    </button>
                </div>
            </form>
        </div>
    );
};

const TripDetail = ({ tripId, setView, userId }) => {
    const [trip, setTrip] = useState(null);
    const [itinerary, setItinerary] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [memberProfiles, setMemberProfiles] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [editingItinerary, setEditingItinerary] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);

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
    
    const handleSaveItinerary = async (item) => {
        if (editingItinerary && editingItinerary.id) {
            const { error } = await supabase.from('itinerary').update(item).eq('id', editingItinerary.id);
            if (error) console.error("Error updating itinerary:", error);
        } else {
            const { error } = await supabase.from('itinerary').insert([{ ...item, trip_id: tripId }]);
            if (error) console.error("Error adding itinerary:", error);
        }
        setEditingItinerary(null);
    };

    const handleDeleteItinerary = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this itinerary item?")) {
            await supabase.from('itinerary').delete().eq('id', itemId);
        }
    };

    const handleSaveExpense = async (item, billFile) => {
        let bill_url = editingExpense ? editingExpense.bill_url : null;
        if (billFile) {
            const fileName = `${userId}/${tripId}/${Date.now()}_${billFile.name}`;
            const { error } = await supabase.storage.from('bills').upload(fileName, billFile);
            if (error) {
                console.error('Error uploading bill:', error);
            } else {
                const { data: { publicUrl } } = supabase.storage.from('bills').getPublicUrl(fileName);
                bill_url = publicUrl;
            }
        }

        if (editingExpense && editingExpense.id) {
            await supabase.from('expenses').update({ ...item, bill_url }).eq('id', editingExpense.id);
        } else {
            await supabase.from('expenses').insert([{ ...item, bill_url, trip_id: tripId, paid_by: userId }]);
        }
        setEditingExpense(null);
    };

    const handleDeleteExpense = async (expenseId) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            await supabase.from('expenses').delete().eq('id', expenseId);
        }
    };

    if (loading) return <Spinner />;
    if (!trip) return <p>Trip not found.</p>;

    const isMember = trip.members.includes(userId);
    const isCreator = trip.creator_id === userId;
    const pledgedUserIds = transactions.filter(t => t.transaction_type === 'pledge').map(t => t.user_id);
    const totalPledged = transactions.filter(t => t.transaction_type === 'pledge').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    const getProfile = (id) => memberProfiles.find(p => p.id === id);

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
                                const profile = getProfile(memberId);
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
                        <button onClick={() => setEditingItinerary({})} className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-600 text-sm">+ Add</button>
                    </div>
                    <div className="space-y-4">
                        {itinerary.sort((a, b) => new Date(a.date) - new Date(b.date)).map(item => (
                            <div key={item.id} className="p-4 bg-gray-50/80 rounded-lg group relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{item.activity}</p>
                                        <p className="text-sm text-gray-500">{item.date} at {item.time}</p>
                                        {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingItinerary(item)} className="text-blue-500 hover:text-blue-700">✏️</button>
                                        <button onClick={() => handleDeleteItinerary(item.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                                    </div>
                                </div>
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
                        <button onClick={() => setEditingExpense({})} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 text-sm">+ Add</button>
                    </div>
                    <div className="space-y-4 mb-4">
                         {expenses.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50/80 rounded-lg group relative">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">Paid by: {getProfile(item.paid_by)?.email?.split('@')[0] || 'A member'}
                                        </p>
                                        <span className="text-xs font-bold text-indigo-700">
                                            {item.split_method === 'you_are_owed' ? '• You are Owed' : '• Split Equally'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.bill_url && (
                                        <a href={item.bill_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </a>
                                    )}
                                    <p className="font-bold text-lg text-gray-900">₹{parseFloat(item.amount).toFixed(2)}</p>
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingExpense(item)} className="text-blue-500 hover:text-blue-700">✏️</button>
                                        <button onClick={() => handleDeleteExpense(item.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                                    </div>
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

            {editingItinerary && <Modal onClose={() => setEditingItinerary(null)}><ItineraryForm onSubmit={handleSaveItinerary} existingItem={editingItinerary} /></Modal>}
            {editingExpense && <Modal onClose={() => setEditingExpense(null)}><ExpenseForm onSubmit={handleSaveExpense} existingItem={editingExpense} /></Modal>}
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

const SettlementCalculator = ({ expenses, pledgedUserIds, memberProfiles, tripName }) => {
    const getProfile = (userId) => memberProfiles.find(p => p.id === userId);

    const settlement = useMemo(() => {
        const balances = {};
        const participatingMembers = memberProfiles.filter(p => pledgedUserIds.includes(p.id));
        const numParticipants = participatingMembers.length;

        if (numParticipants === 0) return { balances: [], transactions: [] };

        participatingMembers.forEach(p => { balances[p.id] = 0; });

        const sharedExpenses = expenses.filter(e => e.split_method === 'split_equally');
        const totalSharedCost = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const individualShare = numParticipants > 0 ? totalSharedCost / numParticipants : 0;

        participatingMembers.forEach(p => { balances[p.id] -= individualShare; });
        
        expenses.forEach(e => {
            if (balances[e.paid_by] !== undefined) {
                balances[e.paid_by] += e.amount;
            }
        });

        const debtors = [];
        const creditors = [];
        Object.entries(balances).forEach(([userId, balance]) => {
            if (balance < 0) debtors.push({ userId, amount: -balance });
            if (balance > 0) creditors.push({ userId, amount: balance });
        });

        const transactions = [];
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const amount = Math.min(debtor.amount, creditor.amount);

            transactions.push({ from: debtor.userId, to: creditor.userId, amount: amount });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount < 0.01) debtors.shift();
            if (creditor.amount < 0.01) creditors.shift();
        }

        return { balances, transactions };
    }, [expenses, pledgedUserIds, memberProfiles]);

    return (
        <div>
            <h3 className="text-2xl font-bold text-center mb-4">Trip Settlement</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Final Balances:</h4>
                <ul className="space-y-2">
                    {Object.entries(settlement.balances).map(([userId, balance]) => (
                        <li key={userId} className="flex justify-between items-center text-sm">
                            <span>{getProfile(userId)?.email || `User...${userId.slice(-6)}`}</span>
                            {balance < 0 ? (
                                <span className="font-bold text-red-600">Owes ₹{(-balance).toFixed(2)}</span>
                            ) : (
                                <span className="font-bold text-green-600">Is Owed ₹{balance.toFixed(2)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-6">
                <h4 className="font-bold mb-2 text-center">How to Settle Up:</h4>
                {settlement.transactions.length > 0 ? (
                    <ul className="space-y-3">
                        {settlement.transactions.map((t, i) => {
                            const toProfile = getProfile(t.to);
                            const fromProfile = getProfile(t.from);
                            const upiLink = `upi://pay?pa=${toProfile?.upi_id}&pn=${toProfile?.email?.split('@')[0]}&am=${t.amount.toFixed(2)}&tn=Ghumakkad Trip: ${tripName}`;
                            
                            return (
                                <li key={i} className="bg-indigo-50 p-3 rounded-lg text-center">
                                    <p>
                                        <span className="font-bold text-red-600">{fromProfile?.email || 'A member'}</span>
                                        {' '}should pay{' '}
                                        <span className="font-bold text-green-600">{toProfile?.email || 'a member'}</span>
                                        {' '}a total of{' '}
                                        <span className="font-bold text-indigo-800">₹{t.amount.toFixed(2)}</span>
                                    </p>
                                    {toProfile?.upi_id && (
                                        <a 
                                            href={upiLink}
                                            className="mt-2 inline-block bg-blue-500 text-white font-bold py-1 px-3 text-sm rounded-full hover:bg-blue-600"
                                        >
                                            Generate UPI Link
                                        </a>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">All balances are settled!</p>
                )}
            </div>
        </div>
    );
};


const ExpenseFeed = ({ expenses, memberProfiles }) => {
    const getProfile = (userId) => memberProfiles.find(p => p.id === userId);

    const categoryIcons = {
        'Food': '🍔',
        'Travel': '✈️',
        'Accommodation': '🏨',
        'Activities': '🎉',
        'Other': '🛍️'
    };

    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Live Feed</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {expenses.length > 0 ? expenses.map(expense => {
                    const profile = getProfile(expense.paid_by);
                    return (
                        <div key={expense.id} className="flex gap-3">
                            <div className="text-2xl">{categoryIcons[expense.category] || '🛍️'}</div>
                            <div>
                                <p className="text-sm text-gray-800">
                                    <span className="font-bold">{profile?.email?.split('@')[0] || 'A member'}</span>
                                    {' '}added an expense for{' '}
                                    <span className="font-bold">{expense.description}</span>.
                                </p>
                                <p className="text-xs text-gray-500">Amount: ₹{expense.amount}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center text-gray-500">No expenses added yet. The feed will update live as you add them!</p>
                )}
            </div>
        </div>
    );
};

const ItineraryForm = ({ onSubmit, existingItem }) => {
    const [activity, setActivity] = useState(existingItem?.activity || '');
    const [date, setDate] = useState(existingItem?.date || '');
    const [time, setTime] = useState(existingItem?.time || '');
    const [notes, setNotes] = useState(existingItem?.notes || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ activity, date, time, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold">{existingItem?.id ? 'Edit' : 'Add'} Itinerary Item</h3>
            <input type="text" value={activity} onChange={e => setActivity(e.target.value)} placeholder="Activity (e.g., Beach Visit)" className="w-full p-2 border rounded" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border rounded" required />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full p-2 border rounded"></textarea>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Save</button>
        </form>
    );
};

const ExpenseForm = ({ onSubmit, existingItem }) => {
    const [description, setDescription] = useState(existingItem?.description || '');
    const [amount, setAmount] = useState(existingItem?.amount || '');
    const [splitMethod, setSplitMethod] = useState(existingItem?.split_method || 'split_equally');
    const [category, setCategory] = useState(existingItem?.category || 'Other');
    const [billFile, setBillFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const categories = ['Food', 'Travel', 'Accommodation', 'Activities', 'Other'];

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setBillFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        await onSubmit({ description, amount, split_method: splitMethod, category }, billFile);
        setUploading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-center">{existingItem?.id ? 'Edit' : 'Add'} Expense</h3>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Dinner at the hotel" className="w-full p-2 border rounded mt-1" required />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 1200" className="w-full p-2 border rounded mt-1" required min="0" step="0.01" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Attach Bill (Optional)</label>
                <input 
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How should this be split?</label>
                <div className="flex gap-4">
                    <div 
                        onClick={() => setSplitMethod('split_equally')}
                        className={`flex-1 p-4 border rounded-lg cursor-pointer text-center ${splitMethod === 'split_equally' ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'bg-gray-50'}`}
                    >
                        <p className="font-bold">Split Equally</p>
                        <p className="text-xs text-gray-500">Among all pledged members</p>
                    </div>
                    <div 
                        onClick={() => setSplitMethod('you_are_owed')}
                        className={`flex-1 p-4 border rounded-lg cursor-pointer text-center ${splitMethod === 'you_are_owed' ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'bg-gray-50'}`}
                    >
                        <p className="font-bold">You are Owed</p>
                        <p className="text-xs text-gray-500">You paid for the group</p>
                    </div>
                </div>
            </div>

            <button type="submit" disabled={uploading} className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-bold disabled:bg-green-400">
                {uploading ? 'Saving...' : 'Save Expense'}
            </button>
        </form>
    );
};

const BudgetForm = ({ tripId, existingBudgets, onClose }) => {
    const categories = ['Food', 'Travel', 'Accommodation', 'Activities', 'Other'];
    const [budgets, setBudgets] = useState(() => {
        const initialState = {};
        categories.forEach(cat => {
            const existing = existingBudgets.find(b => b.category === cat);
            initialState[cat] = existing ? existing.amount : '';
        });
        return initialState;
    });
    const [saving, setSaving] = useState(false);

    const handleSaveBudgets = async (e) => {
        e.preventDefault();
        setSaving(true);

        const upsertData = categories
            .filter(cat => budgets[cat] && budgets[cat] > 0)
            .map(cat => ({
                trip_id: tripId,
                category: cat,
                amount: budgets[cat]
            }));
        
        const { error } = await supabase.from('budgets').upsert(upsertData, { onConflict: 'trip_id, category' });

        if (error) {
            console.error("Error saving budgets:", error);
        } else {
            onClose();
        }
        setSaving(false);
    };
    
    return (
        <form onSubmit={handleSaveBudgets}>
            <h3 className="text-xl font-bold text-center mb-6">Manage Trip Budget</h3>
            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat}>
                        <label className="block text-sm font-medium text-gray-700">{cat}</label>
                        <input
                            type="number"
                            placeholder="Set budget amount"
                            value={budgets[cat]}
                            onChange={(e) => setBudgets({...budgets, [cat]: e.target.value})}
                            className="w-full p-2 border rounded mt-1"
                            min="0"
                        />
                    </div>
                ))}
            </div>
            <button type="submit" disabled={saving} className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 font-bold disabled:bg-indigo-400">
                {saving ? 'Saving...' : 'Save Budgets'}
            </button>
        </form>
    );
};


// This is the main component for this file.
export default function MyTrips() {
    const [view, setView] = useState('tripList'); 
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [editingTrip, setEditingTrip] = useState(null);
    const [session, setSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const userId = session?.user?.id;

    if (!userId) {
        return <Spinner />;
    }
    
    if (editingTrip) {
        return <TripForm setView={() => setEditingTrip(null)} userId={userId} existingTrip={editingTrip} />;
    }

    switch (view) {
        case 'createTrip':
            return <TripForm setView={setView} userId={userId} />;
        case 'tripDetail':
            return <TripDetail tripId={selectedTripId} setView={setView} userId={userId} />;
        case 'tripList':
        default:
            return <TripList setView={setView} setSelectedTripId={setSelectedTripId} setEditingTrip={setEditingTrip} userId={userId} />;
    }
}


import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

const Profile = ({ setView }) => {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [upiId, setUpiId] = useState(''); // NEW: State for UPI ID
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    // Fetch user and profile data on component load
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('upi_id')
                    .eq('id', user.id)
                    .single();
                
                if (error) console.error('Error fetching profile:', error);
                if (profile) setUpiId(profile.upi_id || '');
            }
        };
        fetchData();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const updates = {};
        if (password) updates.password = password;
        
        // Update user password if provided
        if (password) {
            const { error: userError } = await supabase.auth.updateUser({ password });
            if (userError) {
                setError(userError.message);
                setLoading(false);
                return;
            }
        }

        // Update profile with UPI ID
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, upi_id: upiId }, { onConflict: 'id' });
        
        if (profileError) {
            setError(profileError.message);
        } else {
            setMessage('Profile updated successfully!');
            setPassword(''); // Clear password field
        }

        setLoading(false);
    };

    if (!user) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <button 
                onClick={() => setView('main')} 
                className="text-indigo-600 font-semibold mb-6 inline-flex items-center gap-2 hover:text-indigo-800 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">My Profile</h2>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 p-3 bg-gray-100 rounded-md text-gray-600">{user.email}</p>
            </div>

            <hr className="my-8" />

            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Update Your Info</h3>
                
                {/* NEW: UPI ID Input */}
                <div>
                    <label 
                        htmlFor="upi-id" 
                        className="block text-sm font-medium text-gray-700"
                    >
                        Your UPI ID
                    </label>
                    <input
                        id="upi-id"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., yourname@upi"
                    />
                     <p className="text-xs text-gray-500 mt-1">Needed for friends to pay you back easily.</p>
                </div>

                <div>
                    <label 
                        htmlFor="new-password" 
                        className="block text-sm font-medium text-gray-700"
                    >
                        New Password
                    </label>
                    <input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Leave blank to keep current password"
                    />
                </div>
                
                {message && <p className="text-sm text-green-800 bg-green-100 p-3 rounded-lg">{message}</p>}
                {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default Profile;

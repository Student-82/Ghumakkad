import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct
import { Link } from 'react-router-dom';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
            setError("A user with this email address already exists.");
        } else if (data.user) {
            setMessage("Success! Please check your email to confirm your account.");
        }
        setLoading(false);
    };

    return (
        <div className="hero-mountains-background px-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Create Your Account</h1>
                    <p className="mt-2 text-gray-600">Start your next adventure with Ghumakkad.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {message && <p className="text-center text-sm text-green-800 bg-green-100 p-3 rounded-lg">{message}</p>}
                    
                    {error && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-md text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-800">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;

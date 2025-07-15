import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import Signup from './Signup.jsx'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }
  
  if (showSignup) {
      return <Signup goBack={() => setShowSignup(false)} />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#073B4C]">Welcome Back!</h1>
        <p className="text-center text-gray-500">Log in to plan your next adventure.</p>
        
        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#118AB2] focus:border-[#118AB2]"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#118AB2] focus:border-[#118AB2]"
              type="password"
              placeholder="Your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button 
              type="submit"
              className="w-full py-3 px-4 bg-[#118AB2] text-white font-bold rounded-md hover:bg-[#0e7694] transition shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <span>Loading...</span> : <span>Log In</span>}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => setShowSignup(true)} className="font-medium text-[#118AB2] hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}

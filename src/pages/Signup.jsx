import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Signup({ goBack }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)


  const handleSignup = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Success! Please check your email for a confirmation link.')
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#073B4C]">Create Your Account</h1>
        <p className="text-center text-gray-500">Join the community of student travelers!</p>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        {message && <p className="text-green-500 text-center">{message}</p>}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#06D6A0] focus:border-[#06D6A0]"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#06D6A0] focus:border-[#06D6A0]"
              type="password"
              placeholder="Create a strong password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button 
              type="submit"
              className="w-full py-3 px-4 bg-[#06D6A0] text-white font-bold rounded-md hover:bg-[#05b386] transition shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <span>Creating Account...</span> : <span>Sign Up</span>}
            </button>
          </div>
        </form>
         <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={goBack} className="font-medium text-[#118AB2] hover:underline">
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}
// FILE: src/pages/Profile.jsx (UPDATED FOR RESPONSIVENESS)

import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ session, onBack }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true)
      const { user } = session
      const { data, error } = await supabase.from('profiles').select(`username, avatar_url`).eq('id', user.id).single()
      if (error && error.code !== 'PGRST116') { console.error('Error loading user data:', error) } 
      else if (data) { setUsername(data.username); setAvatarUrl(data.avatar_url) }
      setLoading(false)
    }
    getProfile()
  }, [session])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { user } = session
    const updates = { id: user.id, username, avatar_url: avatarUrl, updated_at: new Date() }
    const { error } = await supabase.from('profiles').upsert(updates)
    if (error) { setMessage(`Error: ${error.message}`) } 
    else { setMessage('Profile updated successfully!') }
    setLoading(false)
  }
  
  const updatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password: password })
    if (error) { setMessage(`Error: ${error.message}`) } 
    else { setMessage('Password updated successfully!'); setPassword('') }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold p-2 rounded-full hover:bg-gray-300 transition mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-[#073B4C]">My Profile</h2>
      </div>

      {message && <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <form onSubmit={updateProfile} className="space-y-4">
          <h3 className="text-xl font-bold text-[#073B4C]">Profile Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="text" value={session.user.email} disabled className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input id="username" type="text" value={username || ''} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">Avatar URL</label>
            <input id="avatarUrl" type="text" value={avatarUrl || ''} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <button type="submit" className="w-full bg-[#118AB2] text-white font-bold py-2 px-6 rounded-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>

        <form onSubmit={updatePassword} className="space-y-4">
            <h3 className="text-xl font-bold text-[#073B4C]">Update Password</h3>
            <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                <input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" placeholder="Leave blank to keep unchanged" />
            </div>
            <div>
                <button type="submit" className="w-full bg-[#06D6A0] text-white font-bold py-2 px-6 rounded-full" disabled={loading || !password}>
                {loading ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

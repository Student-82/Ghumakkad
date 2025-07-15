// FILE: src/pages/Dashboard.jsx (UPDATED FOR RESPONSIVENESS)

import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import MyTrips from './MyTrips.jsx'
import Deals from './Deals.jsx'
import Blueprints from './Blueprints.jsx'
import Profile from './Profile.jsx'

export default function Dashboard({ session }) {
  const [view, setView] = useState('main'); // 'main' or 'profile'

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-4 md:p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#073B4C]">Welcome, Traveler!</h1>
                    <p className="text-sm md:text-base text-gray-500">Logged in as: <strong className="text-[#118AB2]">{session.user.email}</strong></p>
                </div>
                <div className="flex items-center gap-2 md:gap-4 mt-4 md:mt-0">
                    <button
                        onClick={() => setView('profile')}
                        className="font-bold py-2 px-4 md:px-6 text-sm md:text-base rounded-full hover:bg-gray-200 transition"
                    >
                        Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-[#FF6B6B] text-white font-bold py-2 px-4 md:px-6 text-sm md:text-base rounded-full hover:bg-[#e65252] transition shadow-lg"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </header>
        
        <main>
            {view === 'main' && (
              <div className="space-y-12">
                  <MyTrips session={session} />
                  <hr className="border-gray-300 my-8" />
                  <Deals />
                  <hr className="border-gray-300 my-8" />
                  <Blueprints />
              </div>
            )}

            {view === 'profile' && (
              <Profile session={session} onBack={() => setView('main')} />
            )}
        </main>
      </div>
    </div>
  )
}

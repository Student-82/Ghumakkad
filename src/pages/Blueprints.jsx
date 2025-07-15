// FILE: src/pages/Blueprints.jsx (UPDATED FOR RESPONSIVENESS)

import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Blueprints() {
  const [loading, setLoading] = useState(true)
  const [blueprints, setBlueprints] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlueprints = async () => {
      const { data, error } = await supabase.from('blueprints').select('*').order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setBlueprints(data)
      setLoading(false)
    }
    fetchBlueprints()
  }, [])

  if (loading) return <p className="text-center text-gray-500">Loading travel plans...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#073B4C] mb-6">Blueprint Itineraries</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {blueprints.map((blueprint) => (
          <div key={blueprint.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
            <img src={blueprint.image_url} alt={blueprint.title} className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/cccccc/FFFFFF?text=Image+Not+Found'; }} />
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#073B4C] mb-2">{blueprint.title}</h3>
              <p className="text-sm font-semibold text-[#118AB2] mb-4">{blueprint.destination}</p>
              <p className="text-gray-600 mb-4 h-24 overflow-hidden text-sm">{blueprint.description}</p>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full">₹{blueprint.budget} Budget</span>
                <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full">{blueprint.duration_days} Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// FILE: src/pages/Deals.jsx (UPDATED FOR RESPONSIVENESS)

import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Deals() {
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDeals = async () => {
      const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setDeals(data)
      setLoading(false)
    }
    fetchDeals()
  }, [])

  if (loading) return <p className="text-center text-gray-500">Searching for the best deals...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#073B4C] mb-6">Student Deal Finder</h2>
      <div className="space-y-6">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 transform hover:shadow-xl transition-shadow duration-300">
            <img src={deal.image_url} alt={deal.title} className="w-full md:w-48 h-48 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/cccccc/FFFFFF?text=Deal'; }} />
            <div className="flex-1 text-center md:text-left">
              <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold text-white ${
                deal.category === 'Flights' ? 'bg-[#FF6B6B]' :
                deal.category === 'Hostels' ? 'bg-[#FFD166]' : 'bg-[#06D6A0]'
              }`}>{deal.category}</span>
              <h3 className="text-xl font-bold text-[#073B4C] mt-2 mb-2">{deal.title}</h3>
              <p className="text-gray-600 mb-4">{deal.description}</p>
            </div>
            <a 
              href={deal.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#118AB2] text-white font-bold py-2 px-6 rounded-full hover:bg-[#0e7694] transition-colors self-center md:self-auto mt-4 md:mt-0"
            >
              Get Deal
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

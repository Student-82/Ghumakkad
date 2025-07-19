import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

const CampusAmbassador = () => {
    const [ambassador, setAmbassador] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAmbassador = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('campus_ambassadors')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error) {
                console.error("Error fetching ambassador:", error);
            } else {
                setAmbassador(data);
            }
            setLoading(false);
        };
        fetchAmbassador();
    }, []);

    if (loading) {
        return <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg text-center"><p>Loading Ambassador Info...</p></div>;
    }

    if (!ambassador) {
        return null;
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">Campus Ambassador of the Month</h2>
            <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl">
                <div className="flex-shrink-0">
                    <img src={ambassador.avatar_url} alt={ambassador.name} className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white" />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-800">{ambassador.name}</h3>
                    <p className="text-md font-semibold text-pink-600">{ambassador.college}</p>
                    <div className="mt-4 bg-white p-4 rounded-lg shadow-inner">
                        <p className="font-bold text-gray-700">🌟 Top Tip:</p>
                        <p className="font-semibold text-gray-800">{ambassador.top_tip_title}</p>
                        <p className="text-sm text-gray-600 mt-1">{ambassador.top_tip_description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampusAmbassador;

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

const StayCard = ({ stay }) => {
    const getHeaderColor = (type) => {
        switch (type) {
            case 'Hostel':
                return 'bg-blue-400';
            case 'Homestay':
                return 'bg-yellow-500';
            default:
                return 'bg-orange-400';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className={`h-32 flex items-center justify-center p-4 ${getHeaderColor(stay.type)}`}>
                <h3 className="text-2xl font-bold text-white text-center">{stay.name.split(' ').slice(0, 2).join(' ')}</h3>
            </div>
            <div className="p-4 flex-grow">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${stay.type === 'Hostel' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {stay.type}
                </span>
                <h3 className="text-xl font-bold text-gray-800">{stay.name}</h3>
                <p className="text-sm font-semibold text-gray-500">{stay.city}</p>
                <p className="text-sm text-gray-600 mt-2 flex-grow">{stay.description}</p>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <span className="text-xl font-bold text-gray-800">₹{stay.price_per_night}</span>
                    <span className="text-sm text-gray-500">/night</span>
                </div>
                <button className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300">
                    View Details
                </button>
            </div>
        </div>
    );
};

const CertifiedStays = () => {
    const [stays, setStays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStays = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('certified_stays')
                .select('*');
            
            if (error) {
                console.error("Error fetching stays:", error);
            } else {
                setStays(data);
            }
            setLoading(false);
        };
        fetchStays();
    }, []);

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Ghumakkad-Certified Stays</h2>
            {loading ? (
                <p>Loading certified stays...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stays.map(stay => (
                        <StayCard key={stay.id} stay={stay} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CertifiedStays;

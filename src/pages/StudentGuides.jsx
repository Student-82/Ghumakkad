import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

// NEW: Helper function to generate a color from a string (for consistent guide colors)
const generateColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

const GuideCard = ({ guide }) => {
    const avatarColor = generateColorFromString(guide.name);
    const avatarTextColor = 'FFFFFF';
    const initials = guide.name.split(' ').map(n => n[0]).join('');

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div 
                style={{ backgroundColor: `#${avatarColor}` }} 
                className="h-40 flex items-center justify-center"
            >
                <span style={{ color: `#${avatarTextColor}` }} className="text-6xl font-black">
                    {initials}
                </span>
            </div>
            <div className="p-4 flex-grow">
                <h3 className="text-xl font-bold text-gray-800">{guide.name}</h3>
                <p className="text-sm font-semibold text-indigo-600">{guide.college}</p>
                <p className="text-sm text-gray-600 mt-2 flex-grow">{guide.bio}</p>
            </div>
            <div className="p-4">
                 <div className="flex flex-wrap gap-2 mb-4">
                    {guide.specialties && guide.specialties.map(tag => (
                        <span key={tag} className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
                <button className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300">
                    Book a Tour
                </button>
            </div>
        </div>
    );
};

const StudentGuides = () => {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('student_guides')
                .select('*');
            
            if (error) {
                console.error("Error fetching guides:", error);
            } else {
                setGuides(data);
            }
            setLoading(false);
        };
        fetchGuides();
    }, []);

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Verified Student Guides</h2>
            {loading ? (
                <p>Loading guides...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {guides.map(guide => (
                        <GuideCard key={guide.id} guide={guide} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentGuides;

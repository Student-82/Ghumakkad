import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

const Spinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

const ItineraryDisplay = ({ blueprint, createTripFromBlueprint, creating }) => (
    <div className="mt-6 bg-white/50 p-4 sm:p-6 rounded-xl shadow-inner">
        <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-4">{blueprint.title}</h3>
        <div className="space-y-4">
            {blueprint.itinerary.map((day, index) => (
                <div key={index}>
                    <h4 className="font-bold text-lg text-gray-800 border-b-2 border-indigo-200 pb-1 mb-2">Day {day.day}: {day.theme}</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm sm:text-base">
                        {day.activities.map((activity, actIndex) => (
                            <li key={actIndex}>{activity}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        <button
            onClick={() => createTripFromBlueprint(blueprint)}
            disabled={creating}
            className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-green-700 transition duration-300 shadow-md disabled:bg-green-400"
        >
            {creating ? 'Creating Trip...' : 'Adopt this Blueprint & Create Trip'}
        </button>
    </div>
);


const Blueprints = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [generatedBlueprint, setGeneratedBlueprint] = useState(null);
    const [message, setMessage] = useState('');

    const handleGenerateBlueprint = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setGeneratedBlueprint(null);
        setMessage('');

        const prompt = `Create a detailed travel itinerary based on this request: "${query}". The destination should be in India. The output must be a structured plan. Include a main title for the trip and a day-by-day breakdown. For each day, provide a theme and a list of activities.`;

        try {
            const apiKey = "AIzaSyAv7H9ap5FU68gKbXQkT6jB0ASiENn9lQw";

            if (apiKey === "AIzaSyAv7H9ap5FU68gKbXQkT6jB0ASiENn9lQw" || !apiKey) {
                 setError("API Key not found. Please add your key from Google AI Studio to test this feature.");
                 setLoading(false);
                 return;
            }

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING" },
                            destination: { type: "STRING" },
                            itinerary: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        day: { type: "NUMBER" },
                                        theme: { type: "STRING" },
                                        activities: {
                                            type: "ARRAY",
                                            items: { type: "STRING" }
                                        }
                                    },
                                    required: ["day", "theme", "activities"]
                                }
                            }
                        },
                        required: ["title", "destination", "itinerary"]
                    }
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(text);
                setGeneratedBlueprint(parsedJson);
            } else {
                setError("Sorry, I couldn't generate an itinerary for that. Please try a different request.");
            }

        } catch (err) {
            console.error("Error generating blueprint:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const createTripFromBlueprint = async (blueprint) => {
        setCreating(true);
        setMessage('');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in to create a trip.");
            setCreating(false);
            return;
        }

        const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .insert({
                title: blueprint.title,
                destination: blueprint.destination,
                creator_id: user.id,
                members: [user.id]
            })
            .select()
            .single();

        if (tripError) {
            console.error("Error creating trip:", tripError);
            setError("Failed to create the trip.");
            setCreating(false);
            return;
        }

        const itineraryItems = blueprint.itinerary.flatMap(day => 
            day.activities.map(activity => ({
                trip_id: tripData.id,
                activity: activity,
                date: new Date(new Date().setDate(new Date().getDate() + day.day - 1)).toISOString().split('T')[0]
            }))
        );

        const { error: itineraryError } = await supabase
            .from('itinerary')
            .insert(itineraryItems);
        
        if (itineraryError) {
            console.error("Error adding itinerary items:", itineraryError);
            setError("Created the trip, but failed to add itinerary items.");
        } else {
            setMessage(`Successfully created your trip: "${blueprint.title}"! You can now see it in "My Trips".`);
        }
        
        setGeneratedBlueprint(null);
        setCreating(false);
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">AI Itinerary Generator</h2>
            
            <form onSubmit={handleGenerateBlueprint} className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 3-day adventure trip in Manali"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md disabled:bg-indigo-400"
                >
                    {loading ? 'Generating...' : 'Generate Blueprint'}
                </button>
            </form>

            <div>
                {loading && <Spinner />}
                {error && <p className="text-center text-red-600 font-semibold p-3 bg-red-100 rounded-lg">{error}</p>}
                {message && <p className="text-center text-green-700 font-semibold p-3 bg-green-100 rounded-lg">{message}</p>}
                
                {generatedBlueprint && (
                    <ItineraryDisplay 
                        blueprint={generatedBlueprint} 
                        createTripFromBlueprint={createTripFromBlueprint}
                        creating={creating}
                    />
                )}
                
                {!loading && !generatedBlueprint && !error && !message && (
                    <p className="text-center text-gray-500">Let our AI plan your next trip! Just tell it what you're looking for.</p>
                )}
            </div>
        </div>
    );
};

export default Blueprints;

import React, { useState } from 'react';

const Spinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

const DealCard = ({ deal }) => (
    <a
        href={deal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white/80 p-4 rounded-lg shadow-md border border-white/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
        <h3 className="font-bold text-lg text-indigo-700">{deal.brand}</h3>
        <p className="font-semibold text-gray-800">{deal.title}</p>
        <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
        <div className="mt-3 text-right">
            <span className="text-xs font-bold text-indigo-600">View Deal &rarr;</span>
        </div>
    </a>
);

const Deals = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deals, setDeals] = useState([]);

    const handleFindDeals = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setDeals([]);

        const prompt = `Based on publicly available information, find student deals related to the following query: "${query}". For each deal, provide the brand, title, a brief description, and a direct URL to the deal or company website. Focus on deals available in India.`;

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
                            deals: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        brand: { type: "STRING" },
                                        title: { type: "STRING" },
                                        description: { type: "STRING" },
                                        url: { type: "STRING" }
                                    },
                                    required: ["brand", "title", "description", "url"]
                                }
                            }
                        }
                    }
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(text);
                setDeals(parsedJson.deals || []);
                if (!parsedJson.deals || parsedJson.deals.length === 0) {
                    setError("No specific deals found for that query. Try being more general!");
                }
            } else {
                setError("Sorry, I couldn't find any deals for that. Try a different search.");
            }

        } catch (err) {
            console.error("Error fetching deals:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">AI Student Deal Finder</h2>
            
            <form onSubmit={handleFindDeals} className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., discounts on laptops or flights to Goa"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md disabled:bg-indigo-400"
                >
                    {loading ? 'Searching...' : 'Find Deals'}
                </button>
            </form>

            <div className="space-y-4">
                {loading && <Spinner />}
                {error && <p className="text-center text-red-600 font-semibold p-3 bg-red-100 rounded-lg">{error}</p>}
                {deals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deals.map((deal, index) => (
                            <DealCard key={index} deal={deal} />
                        ))}
                    </div>
                )}
                {!loading && deals.length === 0 && !error && (
                    <p className="text-center text-gray-500">Find the best student deals in India. Try searching for flights, food, or tech!</p>
                )}
            </div>
        </div>
    );
};

export default Deals;

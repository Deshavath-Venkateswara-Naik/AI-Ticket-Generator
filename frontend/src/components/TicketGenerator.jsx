import { useState, useEffect } from "react";
import { generateTicket, fetchCategories } from "../services/api";

function TicketGenerator() {

    const [message, setMessage] = useState("");
    const [operatorName, setOperatorName] = useState("");
    const [ticket, setTicket] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    const handleGenerate = async () => {
        const data = await generateTicket(message);
        setTicket(data);
        setSelectedCategory(data.category || "");
    };

    const formatCategory = (cat) =>
        cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="min-h-screen bg-[#f7f8fc] flex justify-center items-start pt-10">

            <div className="w-full max-w-2xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 rounded-full bg-gradient-to-b from-red-500 to-red-300"></div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Turito Quick Ticket
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                    <h2 className="font-semibold text-gray-800 mb-2">
                        Step 1 - Basic Input
                    </h2>

                    <p className="text-sm text-gray-500 mb-5">
                        Type a simple message. AI will create proper subject and description automatically.
                    </p>

                    {/* Operator Name */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-600 block mb-1">
                            Operator Name
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Riya Sharma"
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    </div>

                    {/* Message */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-600 block mb-1">
                            Simple Message
                        </label>

                        <textarea
                            rows="4"
                            placeholder="Customer abc@email.com is facing login issue..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleGenerate}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full transition"
                    >
                        Generate Ticket Fields
                    </button>

                    {/* Output */}
                    {ticket && (
                        <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-2">

                            <p><b>Name:</b> {ticket.name}</p>
                            <p><b>Email:</b> {ticket.email}</p>
                            <p><b>Phone:</b> {ticket.phone}</p>
                            <p><b>Issue:</b> {ticket.issue}</p>

                            {/* Category Dropdown */}
                            <div className="flex items-center gap-2">
                                <b>Category:</b>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {formatCategory(cat)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}

export default TicketGenerator;
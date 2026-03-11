import { useState, useEffect, useRef } from "react";
import { generateTicket, generateTicketsFromImage, fetchCategories } from "../services/api";

function TicketGenerator() {

    const [message, setMessage] = useState("");
    const [operatorName, setOperatorName] = useState("");
    const [ticket, setTicket] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [ocrText, setOcrText] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("text"); // "text" or "image"
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setTickets([]);
        setOcrText("");
        try {
            const data = await generateTicket(message);
            setTicket(data);
            setSelectedCategory(data.category || "");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setTicket(null);
        setTickets([]);
        setOcrText("");
    };

    const handleImageGenerate = async () => {
        if (!imageFile) return;
        setLoading(true);
        setTicket(null);
        try {
            const data = await generateTicketsFromImage(imageFile);
            setOcrText(data.ocr_text || "");
            setTickets(data.tickets || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setTickets([]);
        setOcrText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatCategory = (cat) =>
        cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="min-h-screen bg-[#f7f8fc] flex justify-center items-start pt-10 pb-10">

            <div className="w-full max-w-2xl px-4">

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
                        Type a message or upload an image. AI will extract ticket details automatically.
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-5">
                        <button
                            onClick={() => { setMode("text"); setTickets([]); setOcrText(""); }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${mode === "text"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            ✏️ Text Input
                        </button>
                        <button
                            onClick={() => { setMode("image"); setTicket(null); }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${mode === "image"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            📷 Image Upload
                        </button>
                    </div>

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

                    {/* ─── TEXT MODE ─── */}
                    {mode === "text" && (
                        <>
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

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !message.trim()}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-full transition"
                            >
                                {loading ? "Generating..." : "Generate Ticket Fields"}
                            </button>
                        </>
                    )}

                    {/* ─── IMAGE MODE ─── */}
                    {mode === "image" && (
                        <>
                            <div className="mb-4">
                                <label className="text-sm text-gray-600 block mb-1">
                                    Upload Image (screenshot, photo of a ticket, etc.)
                                </label>

                                <div className="flex items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100 cursor-pointer"
                                    />
                                    {imageFile && (
                                        <button
                                            onClick={clearImage}
                                            className="text-xs text-gray-400 hover:text-red-500 transition"
                                        >
                                            ✕ Clear
                                        </button>
                                    )}
                                </div>

                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="mt-3 rounded-lg border border-gray-200 max-h-52 object-contain"
                                    />
                                )}
                            </div>

                            <button
                                onClick={handleImageGenerate}
                                disabled={loading || !imageFile}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-full transition"
                            >
                                {loading ? "Processing Image..." : "Extract Tickets from Image"}
                            </button>
                        </>
                    )}

                    {/* ─── SINGLE TICKET OUTPUT (text mode) ─── */}
                    {ticket && mode === "text" && (
                        <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-2">
                            <p><b>Name:</b> {ticket.name}</p>
                            <p><b>Email:</b> {ticket.email}</p>
                            <p><b>Phone:</b> {ticket.phone}</p>
                            <p><b>Issue:</b> {ticket.issue}</p>

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

                    {/* ─── OCR + MULTI-TICKET OUTPUT (image mode) ─── */}
                    {mode === "image" && ocrText && (
                        <div className="mt-6 border-t pt-4 space-y-4">

                            {/* OCR Raw Text */}
                            <details className="text-sm">
                                <summary className="cursor-pointer text-gray-500 font-medium hover:text-gray-700">
                                    📄 View Extracted OCR Text
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap border">
                                    {ocrText}
                                </pre>
                            </details>

                            {/* Tickets */}
                            <p className="text-sm font-semibold text-gray-700">
                                🎫 {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""} Detected
                            </p>

                            {tickets.map((t, idx) => (
                                <div
                                    key={idx}
                                    className="border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1 bg-gray-50"
                                >
                                    <p className="font-semibold text-gray-800 mb-2">
                                        Ticket #{idx + 1}
                                    </p>
                                    <p><b>Name:</b> {t.name || "—"}</p>
                                    <p><b>Email:</b> {t.email || "—"}</p>
                                    <p><b>Phone:</b> {t.phone || "—"}</p>
                                    <p><b>Issue:</b> {t.issue || "—"}</p>

                                    <div className="flex items-center gap-2 pt-1">
                                        <b>Category:</b>
                                        <select
                                            defaultValue={t.category}
                                            className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {formatCategory(cat)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {t._error && (
                                        <p className="text-red-500 text-xs mt-1">⚠️ {t._error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}

export default TicketGenerator;
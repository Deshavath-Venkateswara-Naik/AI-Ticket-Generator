import { useState, useEffect, useRef, useCallback } from "react";
import { generateTicket, generateTicketsFromImage, fetchCategories, generateTicketFromAudio } from "../services/api";
import { useWhisper } from "../hooks/useWhisper";

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
    const [mode, setMode] = useState("text"); // "text" | "image" | "voice"
    const fileInputRef = useRef(null);

    // Browser Whisper hook (for recording and optional local transcribe)
    const {
        isRecording,
        isPaused,
        isTranscribing: isLocalTranscribing,
        transcript,
        setTranscript,
        audioBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearTranscript,
    } = useWhisper();

    const [isBackendTranscribing, setIsBackendTranscribing] = useState(false);

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

    // Explicit Transcription Button Handler (Calls Backend API)
    const handleTranscribeAction = async () => {
        if (!audioBlob) return;
        setIsBackendTranscribing(true);
        setTicket(null);
        try {
            // New API that takes audio and returns both transcript + generated ticket
            const data = await generateTicketFromAudio(audioBlob);
            if (data._transcript) {
                setTranscript(data._transcript);
            }
            if (data.name || data.issue) {
                setTicket(data);
                setSelectedCategory(data.category || "");
            }
        } catch (err) {
            console.error("Transcription/Generation failed:", err);
        } finally {
            setIsBackendTranscribing(false);
        }
    };

    // Explicit Generate Button Handler (Uses current transcript text)
    const handleGenerateFromTranscript = async () => {
        if (!transcript.trim()) return;
        setLoading(true);
        try {
            const data = await generateTicket(transcript);
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

    const switchMode = (newMode) => {
        setMode(newMode);
        setTicket(null);
        setTickets([]);
        setOcrText("");
    };

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
                        Type a message, upload an image, or speak. AI will extract ticket details automatically.
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-5 flex-wrap">
                        {[
                            { key: "text", label: "✏️ Text Input" },
                            { key: "image", label: "📷 Image Upload" },
                            { key: "voice", label: "🎤 Voice (Audio API)" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => switchMode(key)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${mode === key
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
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

                    {/* ─── VOICE MODE (Manual Controls) ─── */}
                    {mode === "voice" && (
                        <div className="flex flex-col items-center py-6 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

                            <div className="w-full bg-gradient-to-r from-red-500 to-red-400 py-4 px-6 mb-8 text-center text-white">
                                <h3 className="font-bold text-lg">Granular Voice Command</h3>
                                <p className="text-[10px] opacity-80 uppercase tracking-widest">Manual Control Center</p>
                            </div>

                            {/* Control Panel */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md px-8">

                                {/* Start / Stop Button */}
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 rounded-2xl border-2 border-red-200 transition-all group"
                                    >
                                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🎤</span>
                                        <span className="text-[10px] font-bold text-red-600 uppercase">Start Voice</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-black rounded-2xl border-2 border-gray-700 transition-all group"
                                    >
                                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">⏹️</span>
                                        <span className="text-[10px] font-bold text-white uppercase">Stop Voice</span>
                                    </button>
                                )}

                                {/* Pause / Resume Button */}
                                <button
                                    onClick={isPaused ? resumeRecording : pauseRecording}
                                    disabled={!isRecording}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${!isRecording ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed" :
                                            isPaused ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                        }`}
                                >
                                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                                        {isPaused ? "▶️" : "⏸️"}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase ${isPaused ? "text-amber-600" : "text-blue-600"}`}>
                                        {isPaused ? "Resume" : "Pause"}
                                    </span>
                                </button>

                                {/* Transcribe Button (Backend) */}
                                <button
                                    onClick={handleTranscribeAction}
                                    disabled={!audioBlob || isBackendTranscribing || isRecording}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group col-span-1 ${!audioBlob || isBackendTranscribing || isRecording ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed" :
                                            "bg-purple-50 border-purple-200 hover:bg-purple-100"
                                        }`}
                                >
                                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                                        {isBackendTranscribing ? "⏳" : "🔍"}
                                    </span>
                                    <span className="text-[10px] font-bold text-purple-600 uppercase">
                                        {isBackendTranscribing ? "Transcribing..." : "Transcribe"}
                                    </span>
                                </button>

                                {/* Generate Button (Text-to-JSON) */}
                                <button
                                    onClick={handleGenerateFromTranscript}
                                    disabled={!transcript || loading || isBackendTranscribing || isRecording}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group col-span-1 ${!transcript || loading || isBackendTranscribing || isRecording ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed" :
                                            "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                        }`}
                                >
                                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                                        {loading ? "⚙️" : "✨"}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                        {loading ? "Adding..." : "Generate"}
                                    </span>
                                </button>
                            </div>

                            {/* Progress Feedback */}
                            <div className="mt-8 px-8 w-full text-center">
                                {isRecording && (
                                    <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-xs animate-pulse">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        {isPaused ? "PAUSED" : "RECORDING LIVE"}
                                    </div>
                                )}

                                {isBackendTranscribing && (
                                    <div className="space-y-2">
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full animate-progress" style={{ width: '40%' }}></div>
                                        </div>
                                        <p className="text-[10px] text-purple-600 font-bold uppercase">Backend is transcribing with Whisper...</p>
                                    </div>
                                )}

                                {transcript && !isBackendTranscribing && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                                        <div className="text-[8px] text-gray-400 font-bold uppercase mb-1">Transcript</div>
                                        <p className="text-sm italic text-gray-600 leading-snug">"{transcript}"</p>
                                        <button onClick={clearTranscript} className="mt-2 text-[10px] text-gray-400 hover:text-red-500 uppercase font-black">Clear All</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── SINGLE TICKET OUTPUT (text + voice mode) ─── */}
                    {ticket && (mode === "text" || mode === "voice") && (
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
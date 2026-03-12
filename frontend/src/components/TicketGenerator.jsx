// @source "../src"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Image as ImageIcon,
    Mic,
    Type,
    User as UserIcon,
    Settings,
    HelpCircle,
    Search,
    Trash2,
    Loader2,
    Sparkles,
    ChevronRight,
    Upload,
    Play,
    Square,
    Pause,
    RefreshCcw,
    Terminal
} from "lucide-react";
import { generateTicket, generateTicketsFromImage, fetchCategories, generateTicketFromAudio } from "../services/api";
import { useWhisper } from "../hooks/useWhisper";
import ResultCard from "./ResultCard";

export default function TicketGenerator() {
    const [mode, setMode] = useState(null); // null | "text" | "image" | "voice"
    const [operatorName, setOperatorName] = useState("");
    const [message, setMessage] = useState("");
    const [ticket, setTicket] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [ocrText, setOcrText] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isBackendTranscribing, setIsBackendTranscribing] = useState(false);
    const fileInputRef = useRef(null);

    const {
        isRecording,
        isPaused,
        transcript,
        setTranscript,
        audioBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearTranscript,
    } = useWhisper();

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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTranscribeAction = async () => {
        if (!audioBlob) return;
        setIsBackendTranscribing(true);
        setTicket(null);
        try {
            const data = await generateTicketFromAudio(audioBlob);
            if (data._transcript) setTranscript(data._transcript);
            if (data.name || data.issue) setTicket(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsBackendTranscribing(false);
        }
    };

    const handleGenerateFromTranscript = async () => {
        if (!transcript.trim()) return;
        setLoading(true);
        try {
            const data = await generateTicket(transcript);
            setTicket(data);
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

    const menuItems = [
        { id: "text", label: "Text Extraction", icon: Type, description: "Extract from raw messages", color: "bg-red-50 text-red-600" },
        { id: "image", label: "Image Scan", icon: ImageIcon, description: "Extract from screenshots", color: "bg-orange-50 text-orange-600" },
        { id: "voice", label: "Audio Record", icon: Mic, description: "Extract from voice", color: "bg-blue-50 text-blue-600" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setMode(null)}
                >
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-red-200">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-red-600 font-extrabold text-xl tracking-tight block">Turito AI</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Extraction Hub</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="w-8 h-8 bg-white border border-slate-200 text-red-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                            {operatorName ? operatorName[0].toUpperCase() : <UserIcon size={14} />}
                        </div>
                        <input
                            type="text"
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            placeholder="RM Name..."
                            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400 w-24"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><Settings size={18} /></button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><HelpCircle size={18} /></button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {!mode ? (
                        <motion.section
                            key="onboarding"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="max-w-5xl w-full px-8 py-20 flex flex-col items-center"
                        >
                            <div className="text-center mb-16 space-y-4">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                                    Welcome, <span className="text-red-600">{operatorName || 'Partner'}</span>
                                </h1>
                                <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                                    Ready to streamline your ticket generation? Select a module to start extracting structured insights from any source.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => switchMode(item.id)}
                                        className="group relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-red-200/20 hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden h-[360px] flex flex-col justify-end"
                                    >
                                        <div className={`absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-500 text-slate-900`}>
                                            <item.icon size={160} strokeWidth={1} />
                                        </div>

                                        <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                                            <item.icon size={28} />
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 mb-2">{item.label}</h3>
                                        <p className="text-slate-500 font-bold mb-8 text-sm">{item.description}</p>
                                        <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest">
                                            Start Capture <ChevronRight size={14} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.section>
                    ) : (
                        <motion.section
                            key="capture-mode"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl w-full px-8 py-10 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setMode(null)}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center gap-2"
                                >
                                    ← Back to Hub
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Extraction Mode</span>
                                </div>
                            </div>

                            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5">
                                    {mode === 'text' && <Type size={140} />}
                                    {mode === 'image' && <ImageIcon size={140} />}
                                    {mode === 'voice' && <Mic size={140} />}
                                </div>

                                <div className="max-w-xl space-y-8 relative z-10">
                                    <div>
                                        <h2 className="text-4xl font-black text-slate-900 mb-4">Initialize {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</h2>
                                        <p className="text-lg text-slate-500 leading-relaxed font-bold">
                                            {mode === "text" && "Enter human-written text below to extract structured ticket information."}
                                            {mode === "image" && "Scan screenshots using GPT-4o Vision for pinpoint OCR accuracy."}
                                            {mode === "voice" && "Speak naturally into your microphone for automatic structuring."}
                                        </p>
                                    </div>

                                    {mode === "text" && (
                                        <div className="space-y-6">
                                            <textarea
                                                rows="6"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="e.g., John Doe reporting a critical bug in the CMS..."
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 text-lg font-medium focus:bg-white focus:border-red-200 focus:ring-8 focus:ring-red-50 transition-all outline-none"
                                            />
                                            <button
                                                onClick={handleGenerate}
                                                disabled={loading || !message.trim()}
                                                className="h-16 px-10 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-lg rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                                Generate AI Tickets
                                            </button>
                                        </div>
                                    )}

                                    {mode === "image" && (
                                        <div className="space-y-6">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-3 border-dashed border-slate-200 bg-slate-50/50 hover:bg-red-50/20 hover:border-red-200 rounded-[2.5rem] p-16 text-center cursor-pointer transition-all group"
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                                <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-8 h-8 text-red-600" />
                                                </div>
                                                <p className="text-xl font-black text-slate-900">Choose Capture Source</p>
                                                <p className="text-sm text-slate-400 mt-2 font-bold">Secure GPT-4o Vision Scanning</p>
                                            </div>

                                            {imagePreview && (
                                                <div className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                                                    <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover" />
                                                    <div className="absolute inset-0 bg-red-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button onClick={() => fileInputRef.current.click()} className="p-4 bg-white rounded-2xl text-red-600 font-bold hover:scale-110 transition-transform shadow-lg"><RefreshCcw size={24} /></button>
                                                        <button onClick={clearImage} className="p-4 bg-white rounded-2xl text-slate-900 font-bold hover:scale-110 transition-transform shadow-lg"><Trash2 size={24} /></button>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={handleImageGenerate}
                                                disabled={loading || !imageFile}
                                                className="h-16 w-full px-10 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-lg rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                                                Start Neural Scan
                                            </button>
                                        </div>
                                    )}

                                    {mode === "voice" && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-6">
                                                <button
                                                    onClick={isRecording ? stopRecording : startRecording}
                                                    className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-3 transition-all group ${isRecording
                                                        ? "bg-red-50 border-red-200 animate-pulse"
                                                        : "bg-slate-50 border-slate-100 hover:border-red-200 hover:bg-white"
                                                        }`}
                                                >
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isRecording ? "bg-red-600 text-white" : "bg-white text-slate-300 group-hover:bg-red-600 group-hover:text-white"
                                                        }`}>
                                                        {isRecording ? <Square fill="currentColor" size={28} /> : <Mic size={28} />}
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">
                                                        {isRecording ? "Terminate" : "Start Mic"}
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={isPaused ? resumeRecording : pauseRecording}
                                                    disabled={!isRecording}
                                                    className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-3 border-transparent bg-slate-50 hover:bg-white hover:border-slate-100 transition-all disabled:opacity-30 disabled:grayscale"
                                                >
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-slate-300">
                                                        {isPaused ? <Play fill="currentColor" size={28} /> : <Pause fill="currentColor" size={28} />}
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                        {isPaused ? "Resume" : "Pause"}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={handleTranscribeAction}
                                                    disabled={!audioBlob || isBackendTranscribing || isRecording}
                                                    className="h-16 flex-1 bg-white border-2 border-slate-100 hover:border-red-200 hover:text-red-600 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm"
                                                >
                                                    {isBackendTranscribing ? <Loader2 className="animate-spin w-6 h-6" /> : <Terminal className="w-6 h-6" />}
                                                    Transcribe
                                                </button>
                                                <button
                                                    onClick={handleGenerateFromTranscript}
                                                    disabled={!transcript || loading || isRecording}
                                                    className="h-16 flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200 disabled:opacity-40"
                                                >
                                                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                                    Extract
                                                </button>
                                            </div>

                                            {transcript && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-red-50/30 rounded-[2rem] border-2 border-red-50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Voice Transcript</span>
                                                        <button onClick={clearTranscript} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase">Wipe</button>
                                                    </div>
                                                    <p className="text-xl font-bold italic text-slate-700 leading-relaxed underline decoration-red-200 underline-offset-8">"{transcript}"</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results Section */}
                            <div className="space-y-8 pb-32">
                                <div className="flex items-center justify-between border-b-4 border-slate-100 pb-6">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                                        Extraction Results
                                        <span className="h-7 px-3 bg-red-600 text-white rounded-full text-[12px] flex items-center font-black shadow-lg shadow-red-200">
                                            {(ticket ? 1 : 0) + (tickets.length)}
                                        </span>
                                    </h3>
                                </div>

                                {loading && !tickets.length && !ticket && (
                                    <div className="py-20 text-center space-y-6">
                                        <div className="relative inline-block scale-150">
                                            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Consulting LLM Engine</p>
                                    </div>
                                )}

                                <div className="grid gap-8">
                                    {mode === "image" && ocrText && (
                                        <details className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                            <summary className="p-6 cursor-pointer list-none flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                                <Terminal className="w-5 h-5 text-red-600" />
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Neural OCR Dump</span>
                                                <span className="ml-auto text-slate-400 transition-transform duration-300 group-open:rotate-180">↓</span>
                                            </summary>
                                            <div className="p-10 border-t border-slate-100 bg-slate-50/50">
                                                <pre className="text-sm text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">{ocrText}</pre>
                                            </div>
                                        </details>
                                    )}

                                    {ticket && (mode === "text" || mode === "voice") && (
                                        <ResultCard
                                            ticket={ticket}
                                            categories={categories}
                                            formatCategory={formatCategory}
                                            onCategoryChange={(cat) => setTicket({ ...ticket, category: cat })}
                                        />
                                    )}

                                    {tickets.map((t, idx) => (
                                        <ResultCard
                                            key={idx}
                                            ticket={t}
                                            categories={categories}
                                            formatCategory={formatCategory}
                                            onCategoryChange={(cat) => {
                                                const newTickets = [...tickets];
                                                newTickets[idx].category = cat;
                                                setTickets(newTickets);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
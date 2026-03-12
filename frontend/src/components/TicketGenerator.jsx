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
                    onClick={() => {
                        setTicket(null);
                        setTickets([]);
                        setOcrText("");
                        setMessage("");
                        clearImage();
                        clearTranscript();
                    }}
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
                <div className="max-w-7xl w-full px-8 py-12 space-y-12">
                    {/* Welcome Section */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            Welcome, <span className="text-red-600">{operatorName || 'Partner'}</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                            Unified extraction dashboard. Choose your input method below to start generating tickets.
                        </p>
                    </div>

                    {/* Unified Extraction Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                        {/* Text Extraction */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Type size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                        <Type size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Text Extraction</h3>
                                </div>
                                <textarea
                                    rows="10"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g., John Doe reporting a critical bug..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:bg-white focus:border-red-200 transition-all outline-none resize-none flex-1 mb-6"
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !message.trim()}
                                    className="h-14 w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-200"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    Generate Tickets
                                </button>
                            </div>
                        </div>

                        {/* Image Scan */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ImageIcon size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                        <ImageIcon size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Image Scan</h3>
                                </div>

                                <div className="flex-1 mb-6 space-y-4">
                                    {!imagePreview ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-red-50/20 hover:border-red-200 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-red-600" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900">Upload Screenshot</p>
                                        </div>
                                    ) : (
                                        <div className="relative group rounded-3xl overflow-hidden border-2 border-slate-100 h-full shadow-inner bg-slate-50">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-red-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button onClick={() => fileInputRef.current.click()} className="p-3 bg-white rounded-xl text-red-600 hover:scale-110 transition-transform shadow-lg"><RefreshCcw size={18} /></button>
                                                <button onClick={clearImage} className="p-3 bg-white rounded-xl text-slate-900 hover:scale-110 transition-transform shadow-lg"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleImageGenerate}
                                    disabled={loading || !imageFile}
                                    className="h-14 w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-200"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                    Start Neural Scan
                                </button>
                            </div>
                        </div>

                        {/* Audio Record */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Mic size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Mic size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Audio Record</h3>
                                </div>

                                <div className="flex-1 space-y-6 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group ${isRecording
                                                ? "bg-red-50 border-red-200 animate-pulse"
                                                : "bg-slate-50 border-slate-100 hover:border-red-200 hover:bg-white"
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${isRecording ? "bg-red-600 text-white" : "bg-white text-slate-300 group-hover:bg-red-600 group-hover:text-white"
                                                }`}>
                                                {isRecording ? <Square fill="currentColor" size={20} /> : <Mic size={20} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {isRecording ? "Stop" : "Record"}
                                            </span>
                                        </button>

                                        <button
                                            onClick={isPaused ? resumeRecording : pauseRecording}
                                            disabled={!isRecording}
                                            className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-transparent bg-slate-50 hover:bg-white hover:border-slate-100 transition-all disabled:opacity-30"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300">
                                                {isPaused ? <Play fill="currentColor" size={20} /> : <Pause fill="currentColor" size={20} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {isPaused ? "Resume" : "Pause"}
                                            </span>
                                        </button>
                                    </div>

                                    {transcript && (
                                        <div className="p-6 bg-red-50/30 rounded-3xl border border-red-50 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Transcript</span>
                                                <button onClick={clearTranscript} className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase">Clear</button>
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 italic leading-relaxed">"{transcript}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleTranscribeAction}
                                        disabled={!audioBlob || isBackendTranscribing || isRecording}
                                        className="h-14 w-full bg-white border-2 border-slate-100 hover:border-red-200 hover:text-red-600 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm"
                                    >
                                        {isBackendTranscribing ? <Loader2 className="animate-spin w-5 h-5" /> : <Terminal className="w-5 h-5" />}
                                        Transcribe Audio
                                    </button>
                                    <button
                                        onClick={handleGenerateFromTranscript}
                                        disabled={!transcript || loading || isRecording}
                                        className="h-14 w-full bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-200 disabled:opacity-40"
                                    >
                                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                        Extract Tickets
                                    </button>
                                </div>
                            </div>
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
                            {(ticket || tickets.length > 0) && (
                                <button
                                    onClick={() => { setTicket(null); setTickets([]); setOcrText(""); }}
                                    className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                                >
                                    Clear Results
                                </button>
                            )}
                        </div>

                        {loading && !tickets.length && !ticket && (
                            <div className="py-20 text-center space-y-6">
                                <div className="relative inline-block scale-150">
                                    <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Processing Inputs...</p>
                            </div>
                        )}

                        {!loading && !tickets.length && !ticket && (
                            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <div className="mb-4 flex justify-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-slate-400 font-bold">No tickets generated yet. Use any module above to start.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {ocrText && (
                                <div className="col-span-full">
                                    <details className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                        <summary className="p-6 cursor-pointer list-none flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <Terminal className="w-5 h-5 text-red-600" />
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Neural OCR Dump</span>
                                            <span className="ml-auto text-slate-400 transition-transform duration-300 group-open:rotate-180">↓</span>
                                        </summary>
                                        <div className="p-10 border-t border-slate-100 bg-slate-50/50">
                                            <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">{ocrText}</pre>
                                        </div>
                                    </details>
                                </div>
                            )}

                            {ticket && (
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
                </div>
            </main>
        </div>
    );
}
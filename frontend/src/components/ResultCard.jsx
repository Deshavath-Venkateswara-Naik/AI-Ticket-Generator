import { motion } from "framer-motion";
import { User, Mail, Phone, AlertCircle, Tag, CheckCircle2 } from "lucide-react";

export default function ResultCard({ ticket, categories, onCategoryChange, formatCategory }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-red-600" />
                    Extracted Ticket
                </h3>
                {ticket._error && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Error
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Name</p>
                            <p className="text-sm font-medium">{ticket.name || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium truncate max-w-[150px]">{ticket.email || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                            <p className="text-sm font-medium">{ticket.phone || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                        <Tag className="w-4 h-4 text-red-600" />
                        <div className="flex-1">
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Category</p>
                            <select
                                value={ticket.category}
                                onChange={(e) => onCategoryChange?.(e.target.value)}
                                className="w-full bg-transparent text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {formatCategory(cat)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Issue Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {ticket.issue || "No issue description provided."}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

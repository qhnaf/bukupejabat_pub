import React, { useState, useRef, useEffect } from "react";

export default function SearchableSelect({ options, value, onChange, placeholder = "Pilih...", className = "", disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayValue = selectedOption ? selectedOption.label : "";

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={wrapperRef} className={`relative w-full ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
            <div 
                className={`${className} flex justify-between items-center ${disabled ? "bg-slate-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => { 
                    if (!disabled) {
                        setIsOpen(!isOpen); 
                        setSearch(""); 
                    }
                }}
            >
                <span className={`truncate ${displayValue ? "" : "opacity-60"}`}>
                    {displayValue || placeholder}
                </span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto text-sm font-normal">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                        <input
                            type="text"
                            autoFocus
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-700"
                            placeholder="Ketik untuk mencari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`px-3 py-2 cursor-pointer transition-colors hover:bg-sky-50 ${String(opt.value) === String(value) ? "bg-sky-100 text-sky-700 font-bold" : "text-slate-700"}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-slate-400 italic text-xs">Tidak ada hasil ditemukan</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

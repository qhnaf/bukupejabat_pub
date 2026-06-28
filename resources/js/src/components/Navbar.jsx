import React, { useState } from "react";
import axios from "axios";
import Logo from "../assets/images/logo-kemlu.png";

export default function Navbar({ onSignOut, onToggleSidebar, sidebarOpen }) {
    const [menuOpen, setMenuOpen] = useState(false);

    // AMBIL DATA DARI SESSION
    const userName = localStorage.getItem("user_name") || "Admin";
    const userDivisi = localStorage.getItem("user_divisi") || "Super Admin";
    const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";

    // --- 2. FUNGSI LOGOUT BARU (TERHUBUNG KE LARAVEL) ---
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");

            // Lapor ke Laravel (Agar tercatat di Activity Log)
            if (token) {
                await axios.post(
                    "/api/logout",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
            }
        } catch (error) {
            console.error("Gagal lapor logout ke server", error);
        }

        // Hapus Data di Browser
        localStorage.clear(); // Bersihkan semua (token, user, divisi, dll)

        // Redirect ke halaman Login
        window.location.href = "/";
    };
    // -----------------------------------------------------

    return (
        <header className="w-full pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 h-20 flex items-center justify-between px-4 sm:px-6">
                    {/* LOGO SECTION */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label="Toggle menu"
                            aria-expanded={sidebarOpen}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-5 w-5 transition-transform duration-300"
                            >
                                {sidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        <div className="h-32 w-42 flex items-center justify-center">
                            <img
                                src={Logo}
                                alt="logo"
                                className="max-h-14 object-contain"
                            />
                        </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="flex items-center gap-3">

                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <div className="text-sm font-bold text-slate-800">
                                {userName}
                            </div>
                            <div className="text-xs text-slate-500">
                                {userDivisi}
                            </div>
                        </div>

                        {/* PROFILE DROPDOWN */}
                        <div className="relative">
                            <button onClick={() => setMenuOpen((s) => !s)} className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100" aria-expanded={menuOpen}>
                                <div className="h-9 w-9 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                    {userInitial}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/>
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 z-50 overflow-hidden animation-fade-in">
                                    <div className="block sm:hidden px-4 py-3 border-b border-slate-100 bg-slate-50">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {userName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {userDivisi}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            // 3. PANGGIL FUNGSI HANDLE LOGOUT KITA
                                            handleLogout();
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                            />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

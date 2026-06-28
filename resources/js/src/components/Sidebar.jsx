import { NavLink, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();

    // --- LOGIC HAK AKSES ---
    const userPermissions = JSON.parse(localStorage.getItem("permissions") || "[]");
    const isSuperAdmin = localStorage.getItem("user_role") === "superadmin";

    const hasPermission = (menuName) => {
        if (isSuperAdmin || userPermissions.includes("all")) return true;
        return userPermissions.includes(menuName);
    };
    // -----------------------

    // State untuk mengontrol buka-tutup dropdown Pengaturan
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    // State untuk dropdown Data Per SatKerja
    const [isUnitOpen, setIsUnitOpen] = useState(false);
    const isUnitActive = location.pathname.startsWith("/satkerja");

    useEffect(() => {
        if (isUnitActive) {
            setIsUnitOpen(true);
        }
        if (location.pathname.startsWith("/pengaturan")) {
            setIsSettingsOpen(true);
        }
    }, [isUnitActive, location.pathname]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    const handleLogout = () => {
        // Logika logout (sesuaikan dengan sistem auth Anda)
        localStorage.removeItem("isLoggedIn");
        navigate("/login");
    };

    const handleMobileClose = () => {
        if (typeof onClose === "function") {
            onClose();
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={handleMobileClose}
                aria-hidden={!isOpen}
            />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] -translate-x-full transform transition-transform duration-300 ease-out md:static md:z-auto md:w-full md:max-w-[210px] md:translate-x-0 md:flex-shrink-0 ${isOpen ? "translate-x-0" : ""
                    }`}
                aria-hidden={!isOpen}
            >
                <div className="h-full md:h-auto md:sticky md:top-6">
                    <div className="flex h-full flex-col bg-white p-4 shadow-2xl border-r border-slate-200 md:rounded-2xl md:border md:border-slate-100 md:shadow-md">
                        <div className="mb-4 flex items-center justify-between md:hidden">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Menu
                                </p>
                                <h2 className="text-base font-bold text-slate-800">
                                    Navigasi Admin
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleMobileClose}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                                aria-label="Tutup sidebar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-4 w-4"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </div>

                        <nav className="space-y-1 overflow-y-auto pr-1">
                            {/* --- Dashboard Admin --- */}
                            {hasPermission('dashboard') && (
                                <NavLink
                                    to="/dashboard"
                                    onClick={handleMobileClose}
                                    className={({ isActive }) =>
                                        `relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 ${isActive ? "bg-slate-200" : ""}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-sky-500 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                                            <span className="h-5 w-5 bg-sky-100 rounded-sm flex items-center justify-center text-sky-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-800">Dashboard Admin</span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* --- Data pejabat --- */}
                            {hasPermission('data_pejabat') && (
                                <NavLink
                                    to="/pegawai"
                                    end
                                    onClick={handleMobileClose}
                                    className={({ isActive }) =>
                                        `relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 ${isActive ? "bg-slate-200" : ""}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-sky-500 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                                                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Data Pejabat</span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* --- Data Per Unit Kerja (Dropdown) --- */}
                            {hasPermission('data_unit_kerja') && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUnitOpen(!isUnitOpen)}
                                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-200 cursor-pointer transition-all ${isUnitOpen || isUnitActive ? "bg-slate-50" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
                                                    <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Data Unit Kerja</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`size-4 text-slate-400 transition-transform ${isUnitOpen ? "rotate-180" : ""}`}>
                                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {isUnitOpen && (
                                        <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-1 animate-in slide-in-from-top-1">
                                            <NavLink
                                                to="/satkerja/dalam-negeri"
                                                onClick={handleMobileClose}
                                                className={({ isActive }) => `block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                                            >
                                                Dalam Negeri
                                            </NavLink>
                                            <NavLink
                                                to="/satkerja/luar-negeri"
                                                onClick={handleMobileClose}
                                                className={({ isActive }) => `block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                                            >
                                                Luar Negeri
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- Data Admin --- */}
                            {hasPermission('data_admin') && (
                                <NavLink
                                    to="/admin"
                                    onClick={handleMobileClose}
                                    className={({ isActive }) =>
                                        `relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 ${isActive ? "bg-slate-200" : ""}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-sky-500 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Data Admin</span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* --- Unit Kerja --- */}
                            {isSuperAdmin && (
                                <NavLink
                                    to="/unit-kerja"
                                    onClick={handleMobileClose}
                                    className={({ isActive }) =>
                                        `relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 ${isActive ? "bg-slate-200" : ""}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-sky-500 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
                                                    <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Unit Kerja</span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* --- Konsul Kehormatan --- */}
                            {hasPermission('konsul_kehormatan') && (
                                <NavLink
                                    to="/konsul-kehormatan"
                                    onClick={handleMobileClose}
                                    className={({ isActive }) =>
                                        `relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 ${isActive ? "bg-slate-200" : ""}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-sky-500 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path fill-rule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5h-.75V3.75a.75.75 0 0 0 0-1.5h-15ZM9 6a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm-.75 3.75A.75.75 0 0 1 9 9h1.5a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM9 12a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm3.75-5.25A.75.75 0 0 1 13.5 6H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM13.5 9a.75.75 0 0 0 0 1.5H15A.75.75 0 0 0 15 9h-1.5Zm-.75 3.75a.75.75 0 0 1 .75-.75H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM9 19.5v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 19.5Z" clip-rule="evenodd" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Konsul Kehormatan</span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* --- Pengaturan (Dropdown) --- */}
                            {hasPermission('pengaturan') && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-200 cursor-pointer transition-all ${isSettingsOpen ? "bg-slate-100" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="h-5 w-5 bg-slate-100 rounded-sm flex items-center justify-center text-slate-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path fillRule="evenodd" d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Pengaturan</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`size-4 text-slate-400 transition-transform ${isSettingsOpen ? "rotate-180" : ""}`}>
                                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {isSettingsOpen && (
                                        <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-1 animate-in slide-in-from-top-1">
                                            <NavLink
                                                to="/pengaturan/akun"
                                                onClick={handleMobileClose}
                                                className={({ isActive }) => `block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                                            >
                                                Pengaturan Akun
                                            </NavLink>
                                            {isSuperAdmin && (
                                                <NavLink
                                                    to="/pengaturan/sync-data"
                                                    onClick={handleMobileClose}
                                                    className={({ isActive }) => `block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                                                >
                                                    Sinkronisasi Data
                                                </NavLink>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            </aside>
        </>
    );
}

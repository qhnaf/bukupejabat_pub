import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function AccountSettings() {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: "",
        nama: "",
        email: "",
        unit_kerja: "",
        role: "",
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userName = localStorage.getItem('user_name');
                const userDivisi = localStorage.getItem('user_divisi');
                const token = localStorage.getItem('token');

                if (!userName) {
                    console.error("Data user_name tidak ditemukan di Local Storage.");
                    return;
                }

                setFormData((prev) => ({
                    ...prev,
                    nama: userName,
                    unit_kerja: userDivisi || "Pusat / Semua Unit",
                }));

                const response = await axios.get("/api/users", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                const allUsers = response.data.data;
                const matchedUser = allUsers.find(u => u.username === userName);

                if (matchedUser) {
                    setFormData((prev) => ({
                        ...prev,
                        id: matchedUser.id,
                        nama: matchedUser.username,
                        email: matchedUser.email || "-",
                        role: matchedUser.role === "superadmin" ? "Super Admin" : "Admin Unit",
                        unit_kerja: matchedUser.unit_kerja?.nama_unit_kerja || matchedUser.unit_kerja?.deskripsi || userDivisi || "Pusat / Semua Unit",
                    }));
                }

            } catch (error) {
                console.error("Gagal sinkronisasi profil:", error);
            }
        };

        fetchUserProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.id) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Siap',
                text: 'ID User belum ditemukan, tunggu proses memuat selesai.',
                confirmButtonColor: '#0ea5e9'
            });
            return;
        }

        // =====================================
        // VALIDASI FRONTEND UNTUK PASSWORD BARU
        // =====================================
        if (formData.new_password) {
            if (!formData.current_password) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Perhatian',
                    text: 'Masukkan password saat ini untuk dapat mengubah password.',
                    confirmButtonColor: '#0ea5e9'
                });
                return;
            }
            if (formData.new_password !== formData.new_password_confirmation) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Password baru dan konfirmasi tidak cocok!',
                    confirmButtonColor: '#e11d48'
                });
                return;
            }
        }

        setLoading(true);

        const payload = {
            username: formData.nama,
            email: formData.email,
            role: formData.role === "Super Admin" ? "superadmin" : "admin",
        };

        // Sertakan data password ke payload hanya jika diisi
        if (formData.new_password) {
            payload.current_password = formData.current_password;
            payload.new_password = formData.new_password;
        }

        try {
            await axios.put(`/api/users/${formData.id}`, payload);

            localStorage.setItem('user_name', formData.nama);

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Perubahan profil dan akun berhasil disimpan!',
                confirmButtonColor: '#0ea5e9'
            }).then(() => {
                // Kosongkan ulang form password jika sukses
                setFormData(prev => ({
                    ...prev,
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: ""
                }));
                window.location.reload();
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.response?.data?.message || "Terjadi kesalahan saat menyimpan.",
                confirmButtonColor: '#e11d48'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <form onSubmit={handleUpdate} className="space-y-6">

                {/* SECTION 1: PROFIL INFORMASI */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                            Informasi Profil
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Nama Lengkap */}
                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <label className="input input-bordered bg-white border-slate-200 rounded-2xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition-all h-12">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                <input type="text" name="nama" value={formData.nama} onChange={handleChange} className="grow font-semibold text-slate-700" placeholder="Memuat nama..." />
                            </label>
                        </div>

                        {/* Email */}
                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Email Instansi</label>
                            <label className="input input-bordered bg-white border-slate-200 rounded-2xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition-all h-12">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="grow font-semibold text-slate-700" placeholder="Memuat email..." />
                            </label>
                        </div>

                        {/* Unit Kerja (Read Only) */}
                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit Kerja</label>
                            <label className="input input-bordered bg-slate-100/50 border-slate-200 rounded-2xl flex items-center gap-3 h-12 cursor-not-allowed">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3m0 2h18M9 21V9m6 12V9" /></svg>
                                <input type="text" value={formData.unit_kerja} className="grow font-semibold text-slate-400" disabled placeholder="Memuat unit kerja..." />
                            </label>
                        </div>

                        {/* Role (Read Only) */}
                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Level Hak Akses</label>
                            <label className="input input-bordered bg-slate-100/50 border-slate-200 rounded-2xl flex items-center gap-3 h-12 cursor-not-allowed">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                <input type="text" value={formData.role} className="grow font-semibold text-slate-400" disabled placeholder="Memuat hak akses..." />
                            </label>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: KEAMANAN (UBAH PASSWORD) */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 mb-6 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            Keamanan Akun (Ubah Password)
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm h-fit">
                                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Petunjuk Pengubahan Password</p>
                                    <p className="text-xs text-amber-700/80 leading-relaxed">Kosongkan kolom di bawah ini jika Anda tidak ingin mengubah password. Jika ingin mengubahnya, Anda wajib mengisi password saat ini dan memastikan konfirmasi password baru cocok.</p>
                                </div>
                            </div>
                        </div>

                        <div className="form-control w-full md:col-span-2">
                            <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Password Saat Ini</label>
                            <label className="input input-bordered text-slate-600 bg-white border-slate-200 rounded-2xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition-all h-12">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M7 11V7a5 5 0 0 1 10 0v4" /><rect width="18" height="11" x="3" y="11" rx="2" /></svg>
                                <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} className="grow font-semibold text-slate-700" placeholder="Masukkan password lama..." />
                            </label>
                        </div>

                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Password Baru</label>
                            <label className="input input-bordered text-slate-600 bg-white border-slate-200 rounded-2xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition-all h-12">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z" /></svg>
                                <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} className="grow font-semibold text-slate-700" placeholder="Minimal 8 karakter..." />
                            </label>
                        </div>

                        <div className="form-control w-full">
                            <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Konfirmasi Password Baru</label>
                            <label className="input input-bordered text-slate-600 bg-white border-slate-200 rounded-2xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition-all h-12">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z" /></svg>
                                <input type="password" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} className="grow font-semibold text-slate-700" placeholder="Ulangi password baru..." />
                            </label>
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-md w-full bg-sky-600 hover:bg-sky-700 border-none text-white rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        Simpan Perubahan Akun
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
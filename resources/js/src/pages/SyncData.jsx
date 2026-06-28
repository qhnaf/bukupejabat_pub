import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function SyncData() {
    const [isSyncing, setIsSyncing] = useState(false);

    // State untuk Konfigurasi API
    const [apiUrl, setApiUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [httpMethod, setHttpMethod] = useState('GET');
    const [showApiKey, setShowApiKey] = useState(false);

    // State untuk Auto Sync
    const [autoSyncType, setAutoSyncType] = useState('weekly');
    const [syncDay, setSyncDay] = useState('Senin');
    const [syncDate, setSyncDate] = useState('1');
    const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);

    // State untuk Logic Retry & Block
    const [failCount, setFailCount] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    // State untuk Log Sinkronisasi
    const [logs, setLogs] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return { Authorization: `Bearer ${token}` };
    };

    const fetchConfig = async () => {
        try {
            const response = await axios.get("/api/sync-config", {
                headers: getAuthHeaders()
            });
            if (response.data.success) {
                const cfg = response.data.data;
                setApiUrl(cfg.api_url || '');
                setApiKey(cfg.api_key || '');
                setHttpMethod(cfg.http_method || 'GET');
                setIsAutoSyncEnabled(cfg.auto_sync_enabled || false);
                setAutoSyncType(cfg.auto_sync_type || 'weekly');
                setSyncDay(cfg.auto_sync_day || 'Senin');
                setSyncDate(cfg.auto_sync_date?.toString() || '1');
            }
        } catch (error) {
            console.error("Gagal mengambil konfigurasi sync:", error);
        }
    };

    const fetchSyncLogs = async () => {
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await axios.get("/api/sync-logs", {
                headers: getAuthHeaders(),
                params
            });
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil log sinkronisasi:", error);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchSyncLogs();
    }, []);

    useEffect(() => {
        fetchSyncLogs();
    }, [startDate, endDate]);

    const handleExport = () => {
        const token = localStorage.getItem("token");
        let url = `/api/sync-logs/export?token=${token}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;

        axios.get(url, {
            headers: getAuthHeaders(),
            responseType: 'blob'
        }).then((response) => {
            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', `log_sinkronisasi_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            console.error("Gagal export:", err);
            alert("Gagal mengunduh CSV");
        });
    };

    // Efek Retry
    useEffect(() => {
        let retryTimer;
        if (failCount > 0 && failCount < 3 && !isBlocked && isAutoSyncEnabled) {
            retryTimer = setTimeout(() => {
                triggerSync('Auto (Retry)');
            }, 600000);
        }
        return () => clearTimeout(retryTimer);
    }, [failCount, isBlocked, isAutoSyncEnabled]);

    const triggerSync = async (method = 'Manual') => {
        if (isBlocked) {
            Swal.fire({
                icon: 'error',
                title: 'Akses Diblokir',
                text: 'Sinkronisasi telah dihentikan otomatis karena gagal 3 kali berturut-turut.',
                confirmButtonColor: '#e11d48'
            });
            return;
        }

        setIsSyncing(true);

        try {
            const response = await axios.post("/api/sync-data/trigger", { method }, {
                headers: getAuthHeaders()
            });

            setIsSyncing(false);

            if (response.data.success) {
                setFailCount(0);
                fetchSyncLogs();

                if (method === 'Manual') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sinkronisasi Selesai',
                        text: response.data.message || 'Data berhasil ditarik dari API Utama!',
                        confirmButtonColor: '#0ea5e9'
                    });
                }
            } else {
                handleSyncFailure(method, response.data.message);
            }
        } catch (error) {
            setIsSyncing(false);
            const msg = error.response?.data?.message || 'Gagal terhubung ke server.';
            handleSyncFailure(method, msg);
        }
    };

    const handleSyncFailure = (method, errorMsg) => {
        const currentFail = failCount + 1;
        setFailCount(currentFail);
        fetchSyncLogs();

        if (currentFail >= 3) {
            setIsBlocked(true);
            setIsAutoSyncEnabled(false);
            Swal.fire({
                icon: 'error',
                title: 'Sinkronisasi Dihentikan',
                text: 'Sinkronisasi gagal 3 kali berturut-turut. Sistem menghentikan proses ini otomatis.',
                confirmButtonColor: '#e11d48'
            });
        } else {
            if (method === 'Manual') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sinkronisasi Gagal',
                    text: `Gagal menarik data (Percobaan ${currentFail}/3). ${errorMsg}`,
                    confirmButtonColor: '#f59e0b'
                });
            }
        }
    };

    const handleManualSync = () => {
        triggerSync('Manual');
    };

    const handleTestConnection = async () => {
        Swal.fire({
            title: 'Menguji Koneksi...',
            text: 'Sedang menghubungi endpoint API',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const response = await axios.post("/api/sync-data/test-connection", {}, {
                headers: getAuthHeaders()
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Koneksi Berhasil',
                    text: response.data.message,
                    confirmButtonColor: '#0ea5e9'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Koneksi Gagal',
                    text: response.data.message,
                    confirmButtonColor: '#e11d48'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: error.response?.data?.message || 'Tidak dapat terhubung ke server.',
                confirmButtonColor: '#e11d48'
            });
        }
    };

    const handleSaveConfig = async () => {
        try {
            const response = await axios.post("/api/sync-config", {
                api_url: apiUrl,
                api_key: apiKey,
                http_method: httpMethod,
                auto_sync_enabled: isAutoSyncEnabled,
                auto_sync_type: autoSyncType,
                auto_sync_day: syncDay,
                auto_sync_date: parseInt(syncDate),
            }, {
                headers: getAuthHeaders()
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Konfigurasi Tersimpan',
                    text: 'Pengaturan berhasil diperbarui.',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: error.response?.data?.message || 'Terjadi kesalahan.',
                confirmButtonColor: '#e11d48'
            });
        }
    };

    const handleResetBlock = () => {
        setIsBlocked(false);
        setFailCount(0);
        Swal.fire({
            icon: 'success',
            title: 'Blokir Dibuka',
            text: 'Anda dapat melakukan sinkronisasi kembali.',
            showConfirmButton: false,
            timer: 1500
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 relative p-6 md:p-8 min-h-[80vh] mb-5">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Sinkronisasi Data</h2>
                <p className="text-slate-500 text-sm mt-1">Kelola pembaruan data dari API Utama secara manual maupun otomatis.</p>
            </div>

            {/* --- KONFIGURASI ENDPOINT API --- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                    <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Konfigurasi Endpoint API</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Atur koneksi ke database master KEMLU untuk sinkronisasi data pegawai.</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${apiUrl ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span className="text-xs font-semibold text-slate-500">{apiUrl ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* URL Endpoint */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            URL Endpoint <span className="text-rose-400">*</span>
                        </label>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                            <span className="pl-4 text-slate-400 text-sm font-mono select-none shrink-0">https://</span>
                            <input
                                type="text"
                                placeholder="api.kemlu.go.id/v1/pegawai"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                className="flex-1 py-2.5 pr-4 bg-transparent text-sm text-slate-700 focus:outline-none font-mono"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Contoh: api.kemlu.go.id/v1/pegawai atau api.kemlu.go.id/employees</p>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            API Key / Token <span className="text-rose-400">*</span>
                        </label>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="Masukkan API Key atau Bearer Token..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="flex-1 py-2.5 pl-4 bg-transparent text-sm text-slate-700 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="px-3 py-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Tampilkan / Sembunyikan"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Akan dikirim sebagai header <span className="font-mono bg-slate-100 px-1 rounded">Authorization: Bearer ...</span></p>
                    </div>

                    {/* HTTP Method */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">HTTP Method</label>
                        <div className="flex gap-3">
                            {['GET', 'POST'].map((method) => (
                                <label key={method} className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-slate-200 rounded-xl py-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400">
                                    <input type="radio" name="httpMethod" value={method} checked={httpMethod === method} onChange={(e) => setHttpMethod(e.target.value)} className="w-4 h-4 text-indigo-500 focus:ring-indigo-400" />
                                    <span className={`text-sm font-bold font-mono ${method === 'GET' ? 'text-emerald-600' : 'text-amber-600'}`}>{method}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Sesuaikan dengan dokumentasi API KEMLU.</p>
                    </div>

                    {/* Field Mapping Info */}
                    <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                        <div className="text-xs text-amber-700">
                            <p className="font-bold mb-1">Field yang akan disinkronisasi dari API:</p>
                            <div className="flex flex-wrap gap-2">
                                {['nip', 'nama', 'alamat', 'no_handphone', 'Jabatan', 'kd_unker', 'LokasiKerjaName'].map(field => (
                                    <span key={field} className="font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-amber-800">{field}</span>
                                ))}
                            </div>
                            <p className="mt-1.5 text-amber-600">Jika jabatan atau unit kerja belum ada di database, akan dibuat otomatis.</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-semibold text-sm rounded-xl transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 0 1 0-5.303m5.304 0a3.75 3.75 0 0 1 0 5.303m-7.425 2.122a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.789M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            Test Koneksi
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveConfig}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" />
                            </svg>
                            Simpan Konfigurasi API
                        </button>
                    </div>
                </div>
            </div>

            {/* Banner Peringatan Jika Diblokir */}
            {isBlocked && (
                <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-rose-700">Sinkronisasi Diblokir Sementara</h3>
                            <p className="text-xs text-rose-600">Terdeteksi kegagalan 3x berturut-turut. Harap periksa endpoint API Anda.</p>
                        </div>
                    </div>
                    <button onClick={handleResetBlock} className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white border-none w-full sm:w-auto">Buka Blokir</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* --- CARD MANUAL SYNC --- */}
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-200/50 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-sky-300/30 rounded-full blur-3xl"></div>

                    <div className="bg-white p-4 rounded-full shadow-sm text-sky-500 mb-4 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-8 h-8 ${isSyncing ? 'animate-spin' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 z-10 mb-2">Sinkronisasi Manual</h3>
                    <p className="text-sm text-slate-600 z-10 mb-6">Tarik data terbaru dari API Utama sekarang juga. Gunakan opsi ini jika Anda butuh update data instan.</p>

                    <button
                        onClick={handleManualSync}
                        disabled={isSyncing || isBlocked}
                        className="z-10 w-full max-w-xs py-3 px-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSyncing ? 'Sedang Memproses...' : 'Mulai Sync Manual'}
                    </button>
                    {failCount > 0 && !isBlocked && (
                        <p className="z-10 mt-3 text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            Peringatan: Gagal {failCount}/3 kali
                        </p>
                    )}
                </div>

                {/* --- CARD AUTO SYNC --- */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Pengaturan Auto Sync</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isAutoSyncEnabled} onChange={(e) => setIsAutoSyncEnabled(e.target.checked)} disabled={isBlocked} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-disabled:opacity-50"></div>
                        </label>
                    </div>

                    <div className={`space-y-5 transition-opacity ${isAutoSyncEnabled && !isBlocked ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Pola Sinkronisasi</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="syncType" value="weekly" checked={autoSyncType === 'weekly'} onChange={(e) => setAutoSyncType(e.target.value)} className="w-4 h-4 text-sky-500 focus:ring-sky-500" />
                                    <span className="text-sm text-slate-600">Per Minggu</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="syncType" value="monthly" checked={autoSyncType === 'monthly'} onChange={(e) => setAutoSyncType(e.target.value)} className="w-4 h-4 text-sky-500 focus:ring-sky-500" />
                                    <span className="text-sm text-slate-600">Per Bulan</span>
                                </label>
                            </div>
                        </div>

                        {autoSyncType === 'weekly' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Hari Eksekusi</label>
                                <select value={syncDay} onChange={(e) => setSyncDay(e.target.value)} className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50">
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                                        <option key={day} value={day}>Setiap Hari {day}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {autoSyncType === 'monthly' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Eksekusi</label>
                                <select value={syncDate} onChange={(e) => setSyncDate(e.target.value)} className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                                        <option key={date} value={date}>Setiap Tanggal {date}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="pt-2">
                            <button onClick={handleSaveConfig} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors shadow-md">
                                Simpan Konfigurasi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LOG SINKRONISASI --- */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-100 pb-4 gap-4">
                    <h3 className="text-lg font-bold text-slate-800">Riwayat Sinkronisasi (Log)</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-700"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-700"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <button onClick={handleExport} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-100 w-12 text-center">No</th>
                                <th className="px-4 py-3 border-b border-slate-100">Waktu</th>
                                <th className="px-4 py-3 border-b border-slate-100">Metode</th>
                                <th className="px-4 py-3 border-b border-slate-100">Status</th>
                                <th className="px-4 py-3 border-b border-slate-100">Detail Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log, index) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 text-center text-slate-400 font-medium">{index + 1}</td>
                                    <td className="px-4 py-4 text-slate-700 font-medium">
                                        {new Date(log.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${log.method === 'Manual' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {log.method}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {log.status === 'Success' ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                                Berhasil
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-wide">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                                                Gagal
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 italic text-xs leading-relaxed max-w-xs">{log.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

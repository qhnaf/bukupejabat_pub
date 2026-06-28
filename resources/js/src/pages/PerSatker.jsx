import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function UnitDataPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // 1. Data Dummy Satuan Kerja (10 Data)
    const dummyUnits = [
        { id: "U001", nama_unit: "KONSULAT RI DARWIN", alamat: "20 Harry Chan Avenue, Darwin City, NT 0800", telp_hotline: "+61 889 430 200", fax: "+61 889 412 709", email: "darwin.kri@kemlu.go.id", website: "www.kemlu.go.id/darwin/id", hari_kerja: "Senin-Jumat (09.00-17.00)", beda_jam: "+2,5 Jam dari WIB", jml_pgw: "3" },
        { id: "U002", nama_unit: "BIRO SUMBER DAYA MANUSIA", alamat: "Jl. Taman Pejambon No.6, Jakarta Pusat 10110", telp_hotline: "(+62) 21 344 1508", fax: "-", email: "bsdm@kemlu.go.id", website: "www.kemlu.go.id", hari_kerja: "Senin-Jumat (08.00-16.00)", beda_jam: "WIB", jml_pgw: "3" },
        { id: "U003", nama_unit: "KBRI TOKYO", alamat: "2-15-12 Shirokanedai, Minato-ku, Tokyo 108-0071", telp_hotline: "+81 3 3441 4201", fax: "+81 3 3447 1697", email: "tokyo.kbri@kemlu.go.id", website: "www.kemlu.go.id/tokyo", hari_kerja: "Senin-Jumat (09.00-17.00)", beda_jam: "+2 Jam dari WIB", jml_pgw: "2" },
        { id: "U004", nama_unit: "KJRI NEW YORK", alamat: "5 East 68th Street, New York, NY 10065", telp_hotline: "+1 212 879 0600", fax: "+1 212 734 4820", email: "newyork.kjri@kemlu.go.id", website: "www.kemlu.go.id/newyork", hari_kerja: "Senin-Jumat (09.30-17.00)", beda_jam: "-12 Jam dari WIB", jml_pgw: "2" },
        { id: "U005", nama_unit: "KBRI LONDON", alamat: "30 Great Peter Street, Westminster, London SW1P 2BU", telp_hotline: "+44 20 7499 7661", fax: "+44 20 7491 4993", email: "london.kbri@kemlu.go.id", website: "www.kemlu.go.id/london", hari_kerja: "Senin-Jumat (09.00-17.00)", beda_jam: "-7 Jam dari WIB", jml_pgw: "2" },
        { id: "U006", nama_unit: "BIRO HUKUM DAN ORGANISASI", alamat: "Jl. Taman Pejambon No.6, Jakarta Pusat", telp_hotline: "(+62) 21 384 8626", fax: "-", email: "hukum@kemlu.go.id", website: "www.kemlu.go.id", hari_kerja: "Senin-Jumat (08.00-16.00)", beda_jam: "WIB", jml_pgw: "2" },
        { id: "U007", nama_unit: "KJRI SYDNEY", alamat: "236-238 Maroubra Road, Maroubra NSW 2035", telp_hotline: "+61 2 9344 9933", fax: "+61 2 9349 6854", email: "sydney.kjri@kemlu.go.id", website: "www.kemlu.go.id/sydney", hari_kerja: "Senin-Jumat (09.00-17.00)", beda_jam: "+4 Jam dari WIB", jml_pgw: "2" },
        { id: "U008", nama_unit: "DIREKTORAT AFRIKA", alamat: "Gedung Utama Kemlu, Lantai 4, Jakarta Pusat", telp_hotline: "(+62) 21 344 1508", fax: "-", email: "afrika@kemlu.go.id", website: "www.kemlu.go.id", hari_kerja: "Senin-Jumat (08.00-16.00)", beda_jam: "WIB", jml_pgw: "2" },
        { id: "U009", nama_unit: "KBRI PARIS", alamat: "47-49 Rue Cortambert, 75116 Paris", telp_hotline: "+33 1 45 03 07 60", fax: "+33 1 45 04 44 13", email: "paris.kbri@kemlu.go.id", website: "www.kemlu.go.id/paris", hari_kerja: "Senin-Jumat (09.00-17.00)", beda_jam: "-6 Jam dari WIB", jml_pgw: "2" },
        { id: "U010", nama_unit: "PUSAT DIKLAT (PUSDIKLAT)", alamat: "Jl. Sisingamangaraja No.73, Jakarta Selatan", telp_hotline: "(+62) 21 724 3530", fax: "(+62) 21 724 3532", email: "pusdiklat@kemlu.go.id", website: "www.kemlu.go.id", hari_kerja: "Senin-Jumat (08.00-16.00)", beda_jam: "WIB", jml_pgw: "2" }
    ];

    // 2. Data Pegawai Lokal (Mapping berdasarkan ID Satker)
    const localPegawaiData = {
        "U001": [
            { nama: "Pejabat Contoh A", nip: "198501012010011002", jabatan: "Kepala Konsulat" },
            { nama: "Staf Contoh B", nip: "199205122015032001", jabatan: "Staf Administrasi" },
            { nama: "Staf Contoh C", nip: "198811202012121005", jabatan: "Fungsional Diplomat" }
        ],
        "U002": [
            { nama: "Pejabat Contoh A", nip: "197803152002121001", jabatan: "Kepala Biro SDM" },
            { nama: "Staf Contoh B", nip: "198506202008012004", jabatan: "Analis Kepegawaian" },
            { nama: "Staf Contoh C", nip: "199010102018011002", jabatan: "Pengelola Data Personel" }
        ],
        // Default data untuk unit lain
        "default": [
            { nama: "Pejabat Contoh A", nip: "199000000000000001", jabatan: "Pejabat Fungsional" },
            { nama: "Staf Contoh B", nip: "199500000000000002", jabatan: "Pelaksana" }
        ]
    };

    // State Pagination
    const [currentUnitPage, setCurrentUnitPage] = useState(1);
    const unitsPerPage = 5;

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Hitung Pagination
    const totalUnitPages = Math.ceil(dummyUnits.length / unitsPerPage);
    const indexOfLastUnit = currentUnitPage * unitsPerPage;
    const indexOfFirstUnit = indexOfLastUnit - unitsPerPage;
    const currentUnits = dummyUnits.slice(indexOfFirstUnit, indexOfLastUnit);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 p-6 animate-in fade-in duration-500">
            {/* Header Laporan */}
            <div className="mb-6 flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Dashboard Data Satker</h1>
                    {/* <p className="text-xs text-slate-500 font-medium italic">Preview Desain Sistem Informasi Personel (Local Data)</p> */}
                </div>
            </div>

            {/* List Satker */}
            <div className="space-y-4 min-h-[500px]">
                {loading ? (
                    <div className="p-20 text-center text-slate-400 italic">Mempersiapkan Tampilan...</div>
                ) : (
                    currentUnits.map((unit, index) => {
                        // Ambil data pegawai dari local data map
                        const listPegawai = localPegawaiData[unit.id] || localPegawaiData["default"];

                        return (
                            <details key={unit.id} className="group bg-slate-50 border-slate-200 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                                    <div className="flex items-center gap-4">
                                        {/* <div className="bg-slate-800 text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold">
                                            {indexOfFirstUnit + index + 1}
                                        </div> */}
                                        <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">{unit.nama_unit}</span>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4 text-slate-400 group-open:rotate-180 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </summary>

                                <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                                    {/* Grid Info Satker */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[11px]">
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase mb-1">📍 Alamat</p>
                                            <p className="text-slate-600 leading-relaxed">{unit.alamat}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase mb-1">📞 Kontak</p>
                                            <p className="text-slate-700 font-semibold">{unit.telp_hotline}</p>
                                            <p className="text-slate-500 italic">Fax: {unit.fax}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase mb-1">🌐 Digital</p>
                                            <p className="text-sky-600 font-bold underline cursor-pointer">{unit.email}</p>
                                            <p className="text-slate-400 truncate">{unit.website}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase mb-1">⏰ Operasional</p>
                                            <p className="text-slate-700">{unit.hari_kerja}</p>
                                            <p className="text-emerald-600 font-bold">{unit.beda_jam}</p>
                                        </div>
                                    </div>

                                    {/* Data Pegawai */}
                                    <details className="group/pegawai border border-sky-100 rounded-lg overflow-hidden">
                                        <summary className="bg-sky-50 p-3 flex justify-between items-center cursor-pointer hover:bg-sky-100 list-none select-none">
                                            <span className="text-[10px] font-bold text-sky-700 uppercase flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                                                </svg>
                                                Daftar Personel ({unit.jml_pgw})
                                            </span>
                                            <span className="text-sky-400 text-[9px] font-bold uppercase group-open/pegawai:hidden">Klik Detail</span>
                                        </summary>

                                        <div className="bg-white overflow-x-auto">
                                            <table className="w-full text-left text-[11px] border-collapse">
                                                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center font-bold">NO</th>
                                                        <th className="p-3 font-bold uppercase">Nama Lengkap / NIP</th>
                                                        <th className="p-3 font-bold uppercase">Jabatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {listPegawai.map((pegawai, idx) => (
                                                        <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                                                            <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-700 uppercase">{pegawai.nama}</div>
                                                                <div className="text-[9px] font-mono text-slate-400">{pegawai.nip}</div>
                                                            </td>
                                                            <td className="p-3 text-slate-500 italic">{pegawai.jabatan}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                </div>
                            </details>
                        );
                    })
                )}
            </div>

            {/* Pagination UI */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Halaman {currentUnitPage} Dari {totalUnitPages}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={currentUnitPage === 1}
                        onClick={() => {
                            setCurrentUnitPage(currentUnitPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Sebelumnya
                    </button>

                    <button
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={currentUnitPage === totalUnitPages}
                        onClick={() => {
                            setCurrentUnitPage(currentUnitPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Selanjutnya
                    </button>
                </div>
            </div>
        </div>
    );
}
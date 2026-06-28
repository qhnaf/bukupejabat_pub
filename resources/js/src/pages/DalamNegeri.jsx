import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../components/Pagination";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import kemluBg from "../assets/images/logo_kemlu_fix.png";
import { logActivity } from "../utils/logActivity";

export default function DalamNegeri() {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    // Menyimpan pejabat eselon I per unit: { [unitId]: [{nama, jabatan}] }
    const [eselonIMap, setEselonIMap] = useState({});
    // State toggle collapse pejabat eselon I per unit
    const [openEselonI, setOpenEselonI] = useState({});
    // Semua pejabat eselon I lintas unit (untuk card Pimpinan Kemlu)
    const [allEselonI, setAllEselonI] = useState([]);
    const [openPimpinan, setOpenPimpinan] = useState(false);

    // State untuk Pencarian dan Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // State & Efek untuk Shortcut Direct Satker
    const [highlightedUnitId, setHighlightedUnitId] = useState(null);

    const handleGoToMyUnit = (myUnitId) => {
        setSearchTerm("");
        const index = units.findIndex(u => u.id === myUnitId);
        if (index !== -1) {
            const targetPage = Math.floor(index / itemsPerPage) + 1;
            setCurrentPage(targetPage);
            setHighlightedUnitId(myUnitId);
        }
    };

    useEffect(() => {
        if (highlightedUnitId && !loading) {
            let clearTimer;
            const timer = setTimeout(() => {
                const element = document.getElementById(`unit-card-${highlightedUnitId}`);
                if (element) {
                    element.open = true;
                    element.scrollIntoView({ behavior: "smooth", block: "center" });

                    clearTimer = setTimeout(() => {
                        setHighlightedUnitId(null);
                    }, 3000);
                }
            }, 150);
            return () => {
                clearTimeout(timer);
                if (clearTimer) clearTimeout(clearTimer);
            };
        }
    }, [highlightedUnitId, loading]);

    // ==========================================
    // STATE UNTUK MODAL EDIT
    // ==========================================
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [editData, setEditData] = useState({
        id: "",
        kode_unit_kerja: "",
        nama_unit_kerja: "",
        deskripsi: "",
        alamat: "",
        telepon: "",
        fax: "",
        email: "",
        website: "",
    });

    useEffect(() => {
        fetchDalamNegeri();
    }, []);

    const fetchDalamNegeri = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const [unitRes, pegRes] = await Promise.all([
                axios.get("/api/unit-kerja/dalam-negeri", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("/api/pegawai", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const allUnits = unitRes.data.data || [];
            const allPegawai = pegRes.data.data || [];

            const isPejabatDalam = (jabatan) => {
                const j = (jabatan || "").toLowerCase();
                return j.includes("menteri") ||
                    j.includes("sekretaris jenderal") ||
                    j.includes("direktur jenderal") ||
                    j.includes("inspektur jenderal") ||
                    j.includes("kepala badan") ||
                    j.includes("sekretaris badan") ||
                    j.includes("staf ahli") ||
                    j.includes("kepala biro") ||
                    j.includes("direktur") ||
                    j.includes("inspektur") ||
                    j.includes("sekretaris direktorat jenderal") ||
                    j.includes("sekretaris inspektorat jenderal") ||
                    j.includes("kepala pusat") ||
                    j.includes("kepala bagian") ||
                    j.includes("kepala bidang") ||
                    j.includes("kepala subdirektorat") ||
                    j.includes("kepala subdiktorat") ||
                    j.includes("kepala subbagian") ||
                    j.includes("kepala subbag");
            };

            // Susun pejabat Eselon I per unit
            const eselonMap = {};
            const allEselon1 = allPegawai
                .filter(p => p.eselon === 'I')
                .sort((a, b) => {
                    const getPriority = (jabatan) => {
                        const j = (jabatan || '').toLowerCase();
                        if (j.includes('menteri') && !j.includes('wakil')) return 0;
                        if (j.includes('wakil menteri')) return 1;
                        return 2;
                    };
                    const pa = getPriority(a.jabatan);
                    const pb = getPriority(b.jabatan);
                    if (pa !== pb) return pa - pb;
                    return (a.jabatan || '').localeCompare(b.jabatan || '');
                });
            setAllEselonI(allEselon1);

            allUnits.forEach(unit => {
                const eselon1List = allPegawai
                    .filter(p => p.unit_kerja_id === unit.id && p.eselon === 'I')
                    .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
                if (eselon1List.length > 0) {
                    eselonMap[unit.id] = eselon1List;
                }
            });
            setEselonIMap(eselonMap);

            const unitsWithCount = allUnits.map(unit => {
                const count = allPegawai.filter(p => p.unit_kerja_id === unit.id && isPejabatDalam(p.jabatan)).length;
                return { ...unit, pejabat_count: count };
            });

            setUnits(unitsWithCount);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (unit) => {
        setEditData({
            id: unit.id,
            kode_unit_kerja: unit.kode_unit_kerja || "",
            nama_unit_kerja: unit.nama_unit_kerja || "",
            deskripsi: unit.deskripsi || "",
            alamat: unit.alamat || "",
            telepon: unit.telepon || "",
            fax: unit.fax || "",
            email: unit.email || "",
            website: unit.website || "",
        });
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axios.put(
                `/api/unit-kerja/${editData.id}`,
                editData
            );
            setIsEditModalOpen(false);
            fetchDalamNegeri();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Data Dalam Negeri berhasil diperbarui.',
                confirmButtonColor: '#0ea5e9'
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Gagal menyimpan data.',
                confirmButtonColor: '#0ea5e9'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // =======================================================
    // FUNGSI DOWNLOAD PDF PEJABAT (GRUP PER SATKER - PAGE BARU)    
    // =======================================================
    const downloadPDF = async (action = 'preview') => {
        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun daftar pejabat per orang...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Ambil data dari API Pegawai
            const response = await axios.get("/api/pegawai");
            const allPegawai = response.data.data || [];

            // Filter kata kunci jabatan sesuai permintaan
            const allowedKeywords = [
                "menteri", "wakil menteri", "staf ahli", "direktor jenderal", "inspektur jenderal", "kepala badan", "sekretaris badan", "sekretaris jenderal",
                "direktur", "inspektur", "sekretaris direktorat jenderal", "sekretaris inspektorat jenderal",
                "kepala pusat", "kepala bidang", "kepala subdirektorat", "kepala subdiktorat", "kepala subbagian", "kepala subbag",
                "kepala biro", "kepala bagian", "kepala subbagian"
            ];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            const imgWidth = 200;
            const imgHeight = 140;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            const drawWatermark = () => {
                doc.setGState(new doc.GState({ opacity: 1.0 }));
                doc.addImage(kemluBg, 'PNG', x, y, imgWidth, imgHeight);
            };

            const originalAddPage = doc.addPage.bind(doc);
            doc.addPage = function () {
                originalAddPage();
                drawWatermark();
                return this;
            };

            drawWatermark();

            let isFirstPage = true;
            let hasData = false;

            // Looping berdasarkan filteredUnits agar informasi Unit Lengkap (termasuk alamat) bisa diambil
            filteredUnits.forEach((unit) => {
                // Cari pejabat yang ada di unit ini dan jabatannya sesuai kriteria
                const pejabatForUnit = allPegawai.filter(p => {
                    const jabatanStr = (p.jabatan || "").toLowerCase();
                    const isPejabat = allowedKeywords.some(key => jabatanStr.includes(key));
                    return isPejabat && p.unit_kerja_id === unit.id;
                });

                hasData = true;

                // Tambah Halaman Baru untuk setiap Satker (kecuali satker yang pertama)
                if (!isFirstPage) {
                    doc.addPage();
                }
                isFirstPage = false;

                // --- HEADER HALAMAN ---
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.text("DAFTAR PEJABAT DALAM NEGERI", pageWidth / 2, 18, { align: "center" });

                // --- NAMA PANJANG SATKER ---
                doc.setFontSize(12);
                // Mengambil nama panjang dari kolom deskripsi, pastikan tidak error (typo dekripsi diperbaiki)
                const unitNameLong = unit.deskripsi ? unit.deskripsi.toUpperCase() : (unit.nama_unit_kerja ? unit.nama_unit_kerja.toUpperCase() : "UNIT TIDAK DIKETAHUI");

                // Mencegah teks terlalu panjang keluar dari margin kertas
                const splitUnitName = doc.splitTextToSize(unitNameLong, pageWidth - 40);
                doc.text(splitUnitName, pageWidth / 2, 26, { align: "center" });

                let currentY = 26 + splitUnitName.length * 6 + 4;

                // ── GARIS PEMISAH ────────────────────────────────────────────
                doc.setLineWidth(0.4);
                doc.line(15, currentY, pageWidth - 15, currentY);
                currentY += 6;

                // ── HELPER: cetak baris label : nilai (format surat resmi) ──
                const labelX = 15;   // mulai label
                const colonX = 47;   // posisi titik dua
                const valueX = 52;   // mulai nilai
                const maxValueW = pageWidth - valueX - 15; // lebar maks nilai
                const lineH = 5.5;  // jarak antar baris

                doc.setFont("times", "normal");
                doc.setFontSize(10);

                const drawRow = (label, value) => {
                    const displayVal = (!value || String(value).trim() === "" || String(value).trim() === "-") ? "-" : value;
                    doc.setFont("times", "bold");
                    doc.text(label, labelX, currentY);
                    doc.setFont("times", "normal");
                    doc.text(":", colonX, currentY);
                    const splitVal = doc.splitTextToSize(String(displayVal), maxValueW);
                    doc.text(splitVal, valueX, currentY);
                    currentY += splitVal.length * lineH + 1;
                };

                drawRow("Alamat", unit.alamat);
                drawRow("No. Telepon", unit.telepon);
                drawRow("Fax", unit.fax);
                drawRow("Email", unit.email);
                drawRow("Website", unit.website);

                // --- ISI TABEL ---
                const tableRows = [];
                if (pejabatForUnit.length === 0) {
                    tableRows.push([
                        { content: "1.", styles: { valign: 'top', halign: 'center' } },
                        { content: "Data Pejabat Belum Tersedia", colSpan: 5, styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120] } }
                    ]);
                } else {
                    pejabatForUnit.forEach((p, i) => {
                        const formatNama = p.nama_pegawai || p.nama || "-";
                        const formatJabatan = p.jabatan || "-";

                        const titleCaseNama = formatNama === "-" ? "-" : formatNama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                        const titleCaseJabatan = formatJabatan === "-" ? "-" : formatJabatan.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

                        let contacts = [];
                        const kantor = p.alamat && p.alamat !== "-" ? p.alamat : "s.d.a.";
                        contacts.push({ lbl: "Kantor", val: kantor });
                        if (p.telepon && p.telepon !== "-") contacts.push({ lbl: "Telp.", val: p.telepon });
                        if (p.fax && p.fax !== "-") contacts.push({ lbl: "Fax", val: p.fax });
                        if (p.no_handphone && p.no_handphone !== "-") contacts.push({ lbl: "Hp.", val: p.no_handphone });
                        if (p.email && p.email !== "-") contacts.push({ lbl: "Email", val: p.email });
                        if (p.wisma && p.wisma !== "-") contacts.push({ lbl: "Wisma", val: p.wisma });

                        if (contacts.length === 0) contacts.push({ lbl: "-", val: "-" });

                        const span = contacts.length;
                        contacts.forEach((c, cIdx) => {
                            if (cIdx === 0) {
                                tableRows.push([
                                    { content: `${i + 1}.`, rowSpan: span, styles: { valign: 'top', halign: 'center' } },
                                    { content: titleCaseNama, rowSpan: span, styles: { valign: 'top' } },
                                    { content: titleCaseJabatan, rowSpan: span, styles: { valign: 'top' } },
                                    { content: c.lbl, styles: { cellPadding: { top: 4, bottom: 1, left: 4, right: 1 } } },
                                    { content: ":", styles: { cellPadding: { top: 4, bottom: 1, left: 1, right: 1 } } },
                                    { content: c.val, styles: { cellPadding: { top: 4, bottom: 1, left: 1, right: 4 } } }
                                ]);
                            } else {
                                tableRows.push([
                                    { content: c.lbl, styles: { cellPadding: { top: 1, bottom: cIdx === span - 1 ? 4 : 1, left: 4, right: 1 } } },
                                    { content: ":", styles: { cellPadding: { top: 1, bottom: cIdx === span - 1 ? 4 : 1, left: 1, right: 1 } } },
                                    { content: c.val, styles: { cellPadding: { top: 1, bottom: cIdx === span - 1 ? 4 : 1, left: 1, right: 4 } } }
                                ]);
                            }
                        });
                    });
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [["No.", "Nama Lengkap", "Jabatan", { content: "Alamat & Telepon", colSpan: 3, styles: { halign: 'center' } }]],
                    body: tableRows,
                    theme: "plain",
                    styles: { font: "times", fontSize: 10, cellPadding: 4, textColor: [0, 0, 0] },
                    headStyles: { fontStyle: "bold", lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [0, 0, 0], halign: 'center' },
                    columnStyles: {
                        0: { cellWidth: 13, halign: 'center' },
                        1: { cellWidth: 45, halign: 'left' },
                        2: { cellWidth: 50, halign: 'left' },
                        3: { cellWidth: 16 },
                        4: { cellWidth: 4, halign: 'center' },
                        5: { cellWidth: 'auto' }
                    },
                    margin: { left: 15, right: 15 },
                });
            });

            // Jika setelah dilooping ternyata benar-benar tidak ada data
            if (!hasData) {
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat sesuai kriteria di daftar unit ini.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Pejabat_Dalam_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Pejabat_Dalam_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Pejabat berhasil diunduh.', timer: 2000, showConfirmButton: false });
                logActivity("DOWNLOAD PDF", "Mengunduh PDF Seluruh Pejabat Dalam Negeri");
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
                logActivity("PREVIEW PDF", "Preview PDF Seluruh Pejabat Dalam Negeri");
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    const filteredUnits = units.filter((unit) => {
        const searchString = searchTerm.toLowerCase();
        const nama = (unit.nama_unit_kerja || "").toLowerCase();
        const deskripsi = (unit.deskripsi || "").toLowerCase();
        return nama.includes(searchString) || deskripsi.includes(searchString);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentUnits = filteredUnits.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const isSuperAdmin = localStorage.getItem("user_role") === "superadmin";
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    const userUnitId = userSession.unit_kerja_id;
    const myUnit = units.find(u => u.id === userUnitId);

    return (
        <div className="space-y-6 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 p-6 animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">
                        Data Per Unit Kerja - Dalam Negeri
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari unit kerja..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full bg-slate-50"
                            />
                        </div>

                        {/* TOMBOL PDF AKTIF DENGAN LOGIKA PER ORANG */}
                        <div className="join border-none shadow-sm rounded-xl overflow-hidden">
                            <button
                                onClick={() => downloadPDF('preview')}
                                className="join-item p-2 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 hover:border-rose-300 flex items-center justify-center gap-2 group whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-tight">Preview</span>
                            </button>
                            <button
                                onClick={() => downloadPDF('download')}
                                className="join-item p-2 px-4 bg-rose-500 hover:bg-rose-600 text-white transition-colors border-none flex items-center justify-center gap-2 group whitespace-nowrap"
                            >
                                <span className="text-xs font-bold uppercase tracking-tight">Unduh PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banner Shortcut Direct Satker */}
                {!isSuperAdmin && myUnit && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-sky-500 text-white rounded-xl shadow-md shadow-sky-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Akses Cepat Unit Kerja Anda</p>
                                <h4 className="text-sm font-bold text-slate-800 uppercase mt-0.5 leading-snug">
                                    {myUnit.deskripsi || myUnit.nama_unit_kerja}
                                </h4>
                            </div>
                        </div>
                        <button
                            onClick={() => handleGoToMyUnit(myUnit.id)}
                            className="btn btn-sm bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-none shadow-md hover:shadow-lg transition-all rounded-xl gap-2 font-bold text-xs uppercase group"
                        >
                            <span>Buka Unit Kerja</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5 transition-transform group-hover:translate-x-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* ══ CARD PIMPINAN KEMENTERIAN LUAR NEGERI ══════════════════════ */}
                {!loading && allEselonI.length > 0 && (
                    <div className="mb-6 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                        {/* Header / Toggle */}
                        <button
                            type="button"
                            onClick={() => setOpenPimpinan(prev => !prev)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-200 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4 text-slate-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Eselon I</p>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Pimpinan Kementerian Luar Negeri</h3>
                                </div>
                                <span className="ml-1 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                                    {allEselonI.length} Pejabat
                                </span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`size-4 text-slate-400 transition-transform duration-300 ${openPimpinan ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {/* Body dengan animasi expand/collapse */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openPimpinan ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white divide-y divide-slate-100 border-t border-slate-100">
                                {allEselonI.map((p, idx) => (
                                    <div key={p.id || idx} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                                        {/* Nomor urut */}
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        {/* Info pejabat */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 uppercase truncate">
                                                {p.nama_pegawai || p.nama || '-'}
                                            </p>
                                            <p className="text-xs text-sky-600 font-semibold truncate">
                                                {p.jabatan || '-'}
                                            </p>
                                        </div>
                                        {/* Unit kerja */}
                                        <span className="hidden md:block text-[11px] text-slate-400 font-medium flex-shrink-0 text-right max-w-[200px] leading-tight">
                                            {p.nama_unit_kerja || '-'}
                                        </span>
                                        {/* Badge NIP */}
                                        {p.nip && p.nip !== '-' && (
                                            <span className="hidden lg:block text-[10px] font-mono text-slate-400 flex-shrink-0">
                                                {p.nip}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center p-10">
                        <span className="loading loading-spinner text-sky-500"></span>
                        <p className="text-sm mt-2 text-slate-400">Memuat data unit...</p>
                    </div>
                ) : currentUnits.length > 0 ? (
                    currentUnits.map((unit) => (
                        <details
                            key={unit.id}
                            id={`unit-card-${unit.id}`}
                            className={`group mb-4 bg-slate-50 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 ${highlightedUnitId === unit.id ? 'ring-4 ring-sky-400 ring-offset-2 border-sky-400 shadow-xl scale-[1.01] bg-sky-50/30' : 'border-slate-200'}`}
                        >
                            <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-800 uppercase text-medium tracking-wider">
                                        {unit.deskripsi || unit.nama_unit_kerja}
                                    </span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4 text-slate-400 group-open:rotate-180 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </summary>

                            <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                                <div className="flex flex-wrap md:flex-nowrap justify-between gap-6 text-[14px] items-start">
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">Alamat</p>
                                        <p className="text-slate-600 leading-relaxed">{unit.alamat || "-"}</p>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">Kontak</p>
                                        <p className="text-slate-700 font-semibold">{unit.telepon || "-"}</p>
                                        <p className="text-slate-500 italic text-xs">Fax: {unit.fax || "-"}</p>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mt-1">Email</p>
                                        <p className="text-sky-600 font-bold underline break-all whitespace-normal">{unit.email || "-"}</p>
                                        <p className="font-bold text-slate-400 uppercase mt-1">Website</p>
                                        {/* <p className="text-slate-400 break-all whitespace-normal">{unit.website || "-"}</p> */}
                                        <a href={unit.website?.startsWith('http') ? unit.website : `https://${unit.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline break-all hover:text-sky-700 transition-colors">{unit.website || "-"}</a>
                                    </div>
                                    {(() => {
                                        const isSuperAdmin = localStorage.getItem("user_role") === "superadmin";
                                        const userSession = JSON.parse(localStorage.getItem("user") || "{}");
                                        const userUnitId = userSession.unit_kerja_id;

                                        if (isSuperAdmin || unit.id === userUnitId) {
                                            return (
                                                <div className="w-full md:w-auto">
                                                    <p className="font-bold text-slate-400 uppercase mb-1">Aksi</p>
                                                    <button
                                                        onClick={() => openEditModal(unit)}
                                                        className="btn btn-sm btn-square btn-ghost text-amber-500 hover:bg-amber-100"
                                                        title="Edit Unit Kerja"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {/* ── Collapse Pejabat Eselon I ───────────────────────── */}
                                {eselonIMap[unit.id] && (
                                    <div className="border border-indigo-100 rounded-xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setOpenEselonI(prev => ({ ...prev, [unit.id]: !prev[unit.id] }))}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-black shadow-sm shadow-indigo-300">I</span>
                                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Pejabat Eselon I</span>
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">{eselonIMap[unit.id].length}</span>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`size-4 text-indigo-400 transition-transform duration-300 ${openEselonI[unit.id] ? 'rotate-180' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>

                                        <div className={`overflow-hidden transition-all duration-300 ${openEselonI[unit.id] ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="divide-y divide-indigo-50">
                                                {eselonIMap[unit.id].map((p, idx) => (
                                                    <div key={p.id || idx} className="px-4 py-2.5 flex items-center gap-3 bg-white hover:bg-indigo-50/40 transition-colors">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-500 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-700 uppercase truncate">{p.nama_pegawai || p.nama || '-'}</p>
                                                            <p className="text-xs text-indigo-500 font-semibold truncate">{p.jabatan || '-'}</p>
                                                        </div>
                                                        {p.no_handphone && p.no_handphone !== '-' && (
                                                            <span className="text-[11px] text-slate-400 flex-shrink-0">{p.no_handphone}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    onClick={() => navigate(`/detail-pegawai/${unit.id}?source=dalam`)}
                                    className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-sky-100"
                                >
                                    <span className="text-[12px] font-bold text-sky-700 uppercase">
                                        Daftar Pejabat ({unit.pejabat_count || 0})
                                    </span>
                                    <span className="text-sky-400 text-[11px] font-bold uppercase">Klik Detail ➔</span>
                                </div>
                            </div>
                        </details>
                    ))
                ) : (
                    <div className="text-center p-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tidak ada unit kerja yang ditemukan.
                    </div>
                )}

                {filteredUnits.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredUnits.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 text-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                            Edit Dalam Negeri - {editData.deskripsi || editData.nama_unit_kerja}
                        </h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                                    <textarea name="alamat" value={editData.alamat} onChange={handleInputChange} className="textarea w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:outline-none" rows="2" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                                    <input type="text" name="telepon" value={editData.telepon} onChange={handleInputChange} placeholder="Contoh: 021-12345678 EXT.021" className="input input-sm w-full bg-white text-slate-800 border border-slate-300" />
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fax</label>
                                    <input type="text" name="fax" value={editData.fax} onChange={handleInputChange} className="input input-sm w-full bg-white text-slate-800 border border-slate-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <textarea
                                        name="email"
                                        value={editData.email}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="textarea w-full bg-white text-slate-800 border border-slate-300 resize-none"
                                    />
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                    <textarea
                                        name="website"
                                        value={editData.website}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="textarea w-full bg-white text-slate-800 border border-slate-300 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-sm btn-ghost text-slate-500">Batal</button>
                                <button type="submit" disabled={isUpdating} className="btn btn-sm bg-sky-500 text-white border-none">{isUpdating ? "Menyimpan..." : "Simpan Perubahan"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
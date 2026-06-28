import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../components/Pagination";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import kemluBg from "../assets/images/logo_kemlu_fix.png";
import { logActivity } from "../utils/logActivity";

export default function LuarNegeri() {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // State untuk Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // PERBAIKAN: Menambahkan 'kode_unit_kerja' agar lolos validasi wajib di Controller
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
        hari_kerja: "",
        beda_jam: "",
        musim_panas: "",
        musim_dingin: "",
    });

    // Ambil data saat halaman dibuka
    useEffect(() => {
        fetchLuarNegeri();
    }, []);

    const fetchLuarNegeri = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/api/unit-kerja/luar-negeri", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits(response.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (unit) => {
        // PERBAIKAN: Masukkan kode_unit_kerja ke dalam state
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
            hari_kerja: unit.hari_kerja || "",
            beda_jam: unit.beda_jam || "",
            musim_panas: unit.musim_panas || "",
            musim_dingin: unit.musim_dingin || "",
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
                editData,
            );
            setIsEditModalOpen(false);
            fetchLuarNegeri();

            // TAMBAHAN: SweetAlert Sukses
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Data Luar Negeri berhasil diperbarui.',
                confirmButtonColor: '#0ea5e9'
            });
            logActivity("UPDATE", `Memperbarui profil Kedutaan Luar Negeri: ${editData.deskripsi || editData.nama_unit_kerja}`);
        } catch (error) {
            console.error("Gagal mengupdate data:", error);
            // TAMBAHAN: SweetAlert Error
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Gagal menyimpan data. Silakan periksa koneksi atau console.',
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

            filteredUnits.forEach((unit) => {
                const pejabatForUnit = allPegawai.filter(p => p.unit_kerja_id === unit.id);

                hasData = true;

                if (!isFirstPage) {
                    doc.addPage();
                }
                isFirstPage = false;

                // ── JUDUL HALAMAN ──────────────────────────────────────────
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.text("DAFTAR PEJABAT LUAR NEGERI", pageWidth / 2, 18, { align: "center" });

                // ── NAMA SATUAN KERJA (bold, centered, bisa multi-baris) ────
                doc.setFontSize(12);
                const unitNameLong = unit.deskripsi
                    ? unit.deskripsi.toUpperCase()
                    : (unit.nama_unit_kerja ? unit.nama_unit_kerja.toUpperCase() : "UNIT TIDAK DIKETAHUI");
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
                drawRow("Hari Kerja", unit.hari_kerja);
                drawRow("Beda Jam", unit.beda_jam);
                drawRow("Musim Panas", unit.musim_panas);
                drawRow("Musim Dingin", unit.musim_dingin);

                // ── GARIS PEMISAH BAWAH HEADER ───────────────────────────────
                // currentY += 2;
                // doc.setLineWidth(0.4);
                // doc.line(15, currentY, pageWidth - 15, currentY);
                // currentY += 6;

                const tableRows = [];
                if (pejabatForUnit.length === 0) {
                    tableRows.push([
                        { content: "1.", styles: { valign: 'top', halign: 'center' } },
                        { content: "Data Pejabat Belum Tersedia", colSpan: 5, styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120] } }
                    ]);
                } else {
                    pejabatForUnit.forEach((p, i) => {
                        let jabatanFormat = p.jabatan || "-";
                        if (jabatanFormat.toUpperCase().includes("STAF SK")) {
                            jabatanFormat = "Administrasi Umum";
                        }

                        const formatNama = p.nama_pegawai || p.nama || "-";

                        const titleCaseNama = formatNama === "-" ? "-" : formatNama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                        const titleCaseJabatan = jabatanFormat === "-" ? "-" : jabatanFormat.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

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

            if (!hasData) {
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat di daftar unit ini.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Pejabat_Luar_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Pejabat_Luar_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Pejabat Luar Negeri berhasil diunduh.', timer: 2000, showConfirmButton: false });
                logActivity("DOWNLOAD PDF", "Mengunduh PDF Seluruh Pejabat Luar Negeri");
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
                logActivity("PREVIEW PDF", "Preview PDF Seluruh Pejabat Luar Negeri");
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    // 1. Logika Filter (Pencarian)
    const filteredUnits = units.filter((unit) => {
        const searchString = searchTerm.toLowerCase();
        const nama = (unit.nama_unit_kerja || "").toLowerCase();
        const deskripsi = (unit.deskripsi || "").toLowerCase();
        return nama.includes(searchString) || deskripsi.includes(searchString);
    });

    // Reset halaman ke 1 setiap kali user mengetik
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // 2. Logika Pagination
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
                {/* Header dengan Pencarian */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">
                        Data Per Unit Kerja - Luar Negeri
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Kotak Pencarian */}
                        <div className="relative w-full sm:w-64">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Cari unit kerja..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full bg-slate-50" />
                        </div>

                        <div className="join border-none shadow-sm rounded-xl overflow-hidden">
                            <button onClick={() => downloadPDF('preview')} className="join-item p-2 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 hover:border-rose-300 flex items-center justify-center gap-2 group whitespace-nowrap">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-tight">Preview</span>
                            </button>
                            <button onClick={() => downloadPDF('download')} className="join-item p-2 px-4 bg-rose-500 hover:bg-rose-600 text-white transition-colors border-none flex items-center justify-center gap-2 group whitespace-nowrap">
                                <span className="text-xs font-bold uppercase tracking-tight">Unduh PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banner Shortcut Direct Satker */}
                {!isSuperAdmin && myUnit && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Akses Cepat Unit Kerja Anda</p>
                                <h4 className="text-sm font-bold text-slate-800 uppercase mt-0.5 leading-snug">
                                    {myUnit.nama_unit_kerja || myUnit.deskripsi}
                                </h4>
                            </div>
                        </div>
                        <button
                            onClick={() => handleGoToMyUnit(myUnit.id)}
                            className="btn btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-md hover:shadow-lg transition-all rounded-xl gap-2 font-bold text-xs uppercase group"
                        >
                            <span>Buka Unit Kerja</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5 transition-transform group-hover:translate-x-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Looping Data (Menggunakan currentUnits) */}
                {loading ? (
                    <div className="text-center p-10">
                        <span className="loading loading-spinner text-sky-500"></span>
                        <p className="text-sm mt-2 text-slate-400">
                            Memuat data unit...
                        </p>
                    </div>
                ) : currentUnits.length > 0 ? (
                    currentUnits.map((unit) => (
                        <details
                            key={unit.id}
                            id={`unit-card-${unit.id}`}
                            className={`group mb-4 bg-slate-50 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 ${highlightedUnitId === unit.id ? 'ring-4 ring-emerald-400 ring-offset-2 border-emerald-400 shadow-xl scale-[1.01] bg-emerald-50/30' : 'border-slate-200'}`}
                        >
                            <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-800 uppercase text-medium tracking-wider">
                                        {unit.nama_unit_kerja || unit.deskripsi}
                                    </span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4 text-slate-400 group-open:rotate-180 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </summary>

                            <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                                <div className="flex flex-wrap md:flex-nowrap justify-between gap-6 text-[14px] items-start">
                                    <div className="flex-1 min-w-[130px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Alamat
                                        </p>
                                        <p className="text-slate-600 leading-relaxed">
                                            {unit.alamat || "-"}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            No. Telepon
                                        </p>
                                        <p className="text-slate-700 font-semibold">
                                            {unit.telepon || "-"}
                                        </p>
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Fax
                                        </p>
                                        <p className="text-slate-500 italic text-xs">
                                            {unit.fax || "-"}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Email
                                        </p>
                                        <p className="text-sky-600 font-bold underline break-all whitespace-normal">
                                            {unit.email || "-"}
                                        </p>
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Website
                                        </p>
                                        <a href={unit.website?.startsWith('http') ? unit.website : `https://${unit.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline break-all hover:text-sky-700 transition-colors">{unit.website || "-"}</a>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Hari Kerja
                                        </p>
                                        <p className="text-slate-700">
                                            {unit.hari_kerja || "-"}
                                        </p>
                                        <p className="text-emerald-600 font-bold">
                                            {unit.beda_jam || "-"}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="font-bold text-slate-400 uppercase mb-1">
                                            Perbedaan Waktu
                                        </p>
                                        <p className="text-slate-700">
                                            {unit.musim_panas || "-"}
                                        </p>
                                        <p className="text-emerald-600 font-bold">
                                            {unit.musim_dingin || "-"}
                                        </p>
                                    </div>
                                    {/* Aksi */}
                                    {(() => {
                                        const isSuperAdmin = localStorage.getItem("user_role") === "superadmin";
                                        const userSession = JSON.parse(localStorage.getItem("user") || "{}");
                                        const userUnitId = userSession.unit_kerja_id;

                                        if (isSuperAdmin || unit.id === userUnitId) {
                                            return (
                                                <div className="w-full md:w-auto">
                                                    <p className="font-bold text-slate-400 uppercase mb-1">
                                                        Aksi
                                                    </p>
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

                                {/* LOGIKA NAVIGASI LUAR NEGERI DITAMBAHKAN DI SINI */}
                                <div
                                    onClick={() => navigate(`/detail-pegawai/${unit.id}?source=luar`)}
                                    className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-sky-100"
                                >
                                    <span className="text-[12px] font-bold text-sky-700 uppercase">
                                        Daftar Pejabat ({unit.pegawai_count || 0})
                                    </span>
                                    <span className="text-sky-400 text-[11px] font-bold uppercase">
                                        Klik Detail ➔
                                    </span>
                                </div>
                            </div>
                        </details>
                    ))
                ) : (
                    <div className="text-center p-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tidak ada unit kerja yang ditemukan.
                    </div>
                )}

                {/* Pagination Controls */}
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
                        itemsPerPageOptions={[10, 25, 50, 100]}
                    />
                )}
            </div>

            {/* --- KOMPONEN MODAL EDIT luar negeri --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 text-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                            Edit Luar Negeri - {editData.nama_unit_kerja || editData.deskripsi}
                        </h3>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Alamat */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Alamat
                                    </label>
                                    <textarea name="alamat" value={editData.alamat} onChange={handleInputChange} className="textarea w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" rows="3" />
                                </div>

                                {/* Kontak */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        No. Telepon
                                    </label>
                                    <input type="text" name="telepon" value={editData.telepon} onChange={handleInputChange} placeholder="Telepon" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fax
                                    </label>
                                    <input type="text" name="fax" value={editData.fax} onChange={handleInputChange} placeholder="Fax" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                </div>

                                {/* Digital */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <textarea
                                        name="email"
                                        value={editData.email}
                                        onChange={handleInputChange}
                                        placeholder="Email"
                                        rows="2"
                                        className="textarea w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none resize-none"
                                    />
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Website
                                    </label>
                                    <textarea
                                        name="website"
                                        value={editData.website}
                                        onChange={handleInputChange}
                                        placeholder="Website"
                                        rows="2"
                                        className="textarea w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Operasional - khusus Luar Negeri */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hari Kerja
                                    </label>
                                    <input type="text" name="hari_kerja" value={editData.hari_kerja} onChange={handleInputChange} placeholder="Hari Kerja (Cth: Senin - Jumat)" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                    <input type="text" name="beda_jam" value={editData.beda_jam} onChange={handleInputChange} placeholder="Beda Jam" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Perbedaan Waktu
                                    </label>
                                    <input type="text" name="musim_panas" value={editData.musim_panas} onChange={handleInputChange} placeholder="Musim Panas" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                    <input type="text" name="musim_dingin" value={editData.musim_dingin} onChange={handleInputChange} placeholder="Musim Dingin" className="input input-sm w-full bg-white text-slate-800 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-sm btn-ghost text-slate-500 hover:bg-slate-100">
                                    Batal
                                </button>
                                <button type="submit" disabled={isUpdating} className="btn btn-sm bg-sky-500 hover:bg-sky-600 text-white border-none">
                                    {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
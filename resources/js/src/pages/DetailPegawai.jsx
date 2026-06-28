import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "../components/Pagination";
import Swal from "sweetalert2";

// Import gambar background kemlu
import kemluBg from "../assets/images/logo_kemlu_fix.png";
import { logActivity } from "../utils/logActivity";

export default function DetailPegawai() {
    const navigate = useNavigate();
    const { unitId } = useParams();
    const [searchParams] = useSearchParams();
    const source = searchParams.get("source");

    const compressedWatermarkRef = useRef(null);

    const compressWatermark = () => {
        return new Promise((resolve) => {
            if (compressedWatermarkRef.current) {
                resolve(compressedWatermarkRef.current);
                return;
            }
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 140;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 200, 140);
                    const compressed = canvas.toDataURL('image/png');
                    compressedWatermarkRef.current = compressed;
                    resolve(compressed);
                } catch (e) {
                    console.error("Failed to compress watermark inline:", e);
                    resolve(kemluBg);
                }
            };
            img.onerror = () => resolve(kemluBg);
            img.src = kemluBg;
        });
    };

    const [units, setUnits] = useState([]);
    const [unitName, setUnitName] = useState("");
    const [unitProfile, setUnitProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // =======================================================
    // LOGIK PENYUSUNAN (ORDERING) 4 LAPISAN
    // =======================================================
    const getBobotRank = (bobot) => {
        if (bobot === 'I') return 1;
        if (bobot === 'II') return 2;
        if (bobot === 'III') return 3;
        if (bobot === 'IV') return 4;
        return 99;
    };

    // Fungsi pintar membaca kata kunci jawatan jika tiada kode_jabatan
    const getKeywordRank = (jabatan) => {
        const j = (jabatan || "").toLowerCase();

        // 1. Hierarki Dalam Negeri Berdasarkan Permintaan Spesifik
        if (j.includes("menteri") && !j.includes("wakil menteri")) return 1;
        if (j.includes("wakil menteri")) return 2;
        if (j.includes("direktur jenderal") && !j.includes("sekretaris")) return 3;
        if (j.includes("kepala badan")) return 4;
        if (j.includes("inspektur jenderal") && !j.includes("sekretaris")) return 5;
        if (j.includes("sekretaris badan")) return 6;
        
        if (j.includes("sekretaris direktorat jenderal")) return 7;
        if (j.includes("sekretaris inspektorat jenderal")) return 8;
        if (j.includes("kepala pusat")) return 9;
        if (j.includes("kepala biro")) return 10;
        
        if (j.includes("kepala bagian")) return 11;
        if (j.includes("kepala bidang")) return 12;
        if (j.includes("kepala subdirektorat") || j.includes("kepala subdiktorat")) return 13;
        if (j.includes("kepala subbagian") || j.includes("kepala subbag")) return 14;
        
        // 2. Fallback untuk posisi lain yang mungkin ada agar tidak tenggelam di bawah staf
        if (j.includes("sekretaris jenderal")) return 15;
        if (j.includes("staf ahli")) return 16;
        if (j.includes("direktur") && !j.includes("jenderal") && !j.includes("subdirektorat")) return 17;
        if (j.includes("inspektur") && !j.includes("jenderal")) return 18;

        return 99; // Staf / posisi lainnya
    };

    const filteredUnits = units.filter((unit) => {
        const searchLower = searchTerm.toLowerCase();
        const matchSearch =
            (unit.nama_pegawai || "").toLowerCase().includes(searchLower) ||
            (unit.nip || "").toLowerCase().includes(searchLower) ||
            (unit.jabatan || "").toLowerCase().includes(searchLower);

        let matchJabatan = true;
        if (source === "dalam") {
            const jabatanLower = (unit.jabatan || "").toLowerCase();
            matchJabatan =
                jabatanLower.includes("menteri") ||
                jabatanLower.includes("sekretaris jenderal") ||
                jabatanLower.includes("direktur jenderal") ||
                jabatanLower.includes("inspektur jenderal") ||
                jabatanLower.includes("kepala badan") ||
                jabatanLower.includes("sekretaris badan") ||
                jabatanLower.includes("staf ahli") ||
                jabatanLower.includes("kepala biro") ||
                jabatanLower.includes("direktur") ||
                jabatanLower.includes("inspektur") ||
                jabatanLower.includes("sekretaris direktorat jenderal") ||
                jabatanLower.includes("sekretaris inspektorat jenderal") ||
                jabatanLower.includes("kepala pusat") ||
                jabatanLower.includes("kepala bagian") ||
                jabatanLower.includes("kepala bidang") ||
                jabatanLower.includes("kepala subdirektorat") ||
                jabatanLower.includes("kepala subdiktorat") ||
                jabatanLower.includes("kepala subbagian") ||
                jabatanLower.includes("kepala subbag");
        }
        return matchSearch && matchJabatan;
    });

    // PELAKSANAAN SORTING: BOBOT -> KODE JABATAN (LUAR NEGERI) / KATA KUNCI JAWATAN (DALAM NEGERI) -> NAMA
    const sortedUnits = [...filteredUnits].sort((a, b) => {
        const rankA = getBobotRank(a.bobot);
        const rankB = getBobotRank(b.bobot);
        if (rankA !== rankB) return rankA - rankB;

        if (source === "luar") {
            // Prioritaskan Duta Besar di urutan paling atas
            const isDutaBesarA = (a.jabatan || "").toLowerCase().includes("duta besar");
            const isDutaBesarB = (b.jabatan || "").toLowerCase().includes("duta besar");

            if (isDutaBesarA && !isDutaBesarB) return -1;
            if (!isDutaBesarA && isDutaBesarB) return 1;

            // Luar Negeri: Prioritas Kode Jabatan dari DB
            const kodeA = (a.kode_jabatan && a.kode_jabatan !== '-') ? a.kode_jabatan.toString() : "ZZZZ";
            const kodeB = (b.kode_jabatan && b.kode_jabatan !== '-') ? b.kode_jabatan.toString() : "ZZZZ";

            if (kodeA !== kodeB) {
                return kodeA.localeCompare(kodeB, undefined, { numeric: true, sensitivity: 'base' });
            }
        } else {
            // Dalam Negeri: Prioritas Kata Kunci Jawatan (Hierarki Teks)
            const keyRankA = getKeywordRank(a.jabatan);
            const keyRankB = getKeywordRank(b.jabatan);
            if (keyRankA !== keyRankB) return keyRankA - keyRankB;
        }

        // Terakhir: Abjad Nama Pegawai
        return (a.nama_pegawai || "").localeCompare(b.nama_pegawai || "");
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentUnits = sortedUnits.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(sortedUnits.length / itemsPerPage);

    // FUNGSI KHUSUS UNTUK MEMFORMAT JABATAN "STAF SK..." DI LUAR NEGERI
    const formatJabatan = (jabatan) => {
        if (!jabatan) return "-";
        if (source === "luar" && jabatan.toUpperCase().includes("STAF SK")) {
            return "Administrasi Umum";
        }
        return jabatan;
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const openEditModal = (unit) => {
        setSelectedUnit(unit);
        document.getElementById("modal_edit_pegawai").showModal();
    };

    useEffect(() => {
        if (unitId) fetchPegawai();
    }, [unitId]);

    const fetchPegawai = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/api/pegawai/unit/${unitId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits(response.data.data || []);
            setUnitName(response.data.unit_nama || "");
            setUnitProfile(response.data.unit_profil || null);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const formData = new FormData(e.target);
        const data = {
            nama: formData.get("nama"),
            email: formData.get("email"),
            no_handphone: formData.get("no_handphone"),
            jabatan: formData.get("jabatan"),
            alamat: formData.get("alamat"),
            wisma: formData.get("wisma"),
            bobot: formData.get("bobot"),
            tmt_kedatangan: formData.get("tmt_kedatangan"),
            tmt_credential: formData.get("tmt_credential"),
        };

        try {
            await axios.put(`/api/pegawai/${selectedUnit.id}`, data);
            document.getElementById("modal_edit_pegawai").close();
            fetchPegawai();
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data Pegawai berhasil diperbarui.', confirmButtonColor: '#0ea5e9' });
            logActivity("UPDATE", `Memperbarui data pegawai: ${data.nama}`);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal menyimpan data.', confirmButtonColor: '#0ea5e9' });
        } finally {
            setIsUpdating(false);
        }
    };

    const downloadExcel = () => {
        const aoa = [
            ["DAFTAR PEJABAT " + (source === "luar" ? "LUAR NEGERI" : "DALAM NEGERI")],
            [unitName ? unitName.toUpperCase() : "UNIT TIDAK DIKETAHUI"],
        ];

        if (unitProfile) {
            if (unitProfile.alamat && unitProfile.alamat !== "-") {
                aoa.push([unitProfile.alamat]);
            }
            let kontak = [];
            if (unitProfile.telepon && unitProfile.telepon !== "-") kontak.push(`Telp: ${unitProfile.telepon}`);
            if (unitProfile.email && unitProfile.email !== "-") kontak.push(`Email: ${unitProfile.email}`);
            if (unitProfile.website && unitProfile.website !== "-") kontak.push(`Web: ${unitProfile.website}`);
            if (kontak.length > 0) aoa.push([kontak.join(" | ")]);

            if (source === "luar") {
                let op = [];
                if (unitProfile.hari_kerja && unitProfile.hari_kerja !== "-") op.push(`Hari Kerja: ${unitProfile.hari_kerja}`);
                if (unitProfile.musim_dingin && unitProfile.musim_dingin !== "-") op.push(`M. Dingin: ${unitProfile.musim_dingin}`);
                if (unitProfile.musim_panas && unitProfile.musim_panas !== "-") op.push(`M. Panas: ${unitProfile.musim_panas}`);
                if (op.length > 0) aoa.push([op.join(" | ")]);
            }
        }
        aoa.push([]); // Baris kosong sebelum tabel

        const headers = ["No", "NIP", "Nama Lengkap", "Jabatan", "Email", "No. Telepon", "Alamat Kantor", "Wisma", "Bobot", "TMT Kedatangan", "TMT Credential"];
        aoa.push(headers);

        const dataRows = sortedUnits.map((unit, index) => {
            const formatNama = unit.nama_pegawai || "-";
            const titleCaseNama = formatNama === "-" ? "-" : formatNama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
            let jabatan = formatJabatan(unit.jabatan);
            const titleCaseJabatan = jabatan === "-" ? "-" : jabatan.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

            return [
                index + 1,
                unit.nip || "-",
                titleCaseNama,
                titleCaseJabatan,
                unit.email || "-",
                unit.telepon || "-",
                unit.alamat || "-",
                unit.wisma || "-",
                unit.bobot || "-",
                unit.tmt_kedatangan || "-",
                unit.tmt_credential || "-"
            ];
        });

        dataRows.forEach(row => aoa.push(row));

        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pegawai");
        const fileName = unitName ? unitName.replace(/\s+/g, "_") : "Data_Pegawai";
        XLSX.writeFile(workbook, `Buku_Pejabat_${fileName}.xlsx`);
        logActivity("DOWNLOAD EXCEL", `Mengunduh Excel Daftar Pejabat ${unitName || ""}`);
    };

    const downloadCSV = () => {
        const headers = ["No", "NIP", "Nama Lengkap", "Jabatan", "Email", "No. Telepon", "Alamat Kantor", "Wisma", "Bobot", "TMT Kedatangan", "TMT Credential"];
        const rows = sortedUnits.map((unit, index) => [
            index + 1, `"${unit.nip || "-"}"`, `"${unit.nama_pegawai || "-"}"`, `"${formatJabatan(unit.jabatan)}"`, `"${unit.email || "-"}"`, `"${unit.telepon || "-"}"`, `"${unit.alamat || "-"}"`, `"${unit.wisma || "-"}"`, `"${unit.bobot || "-"}"`, `"${unit.tmt_kedatangan || "-"}"`, `"${unit.tmt_credential || "-"}"`
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const fileName = unitName ? unitName.replace(/\s+/g, "_") : "Data_Pegawai";
        link.setAttribute("href", url);
        link.setAttribute("download", `Buku_Pejabat_${fileName}.csv`);
        link.click();
        logActivity("DOWNLOAD CSV", `Mengunduh CSV Daftar Pejabat ${unitName || ""}`);
    };

    const downloadPDF = async (action = 'preview') => {
        try {
            const watermarkData = await compressWatermark();
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // Buat ngelebarin
            const imgWidth = 200;
            const imgHeight = 140;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Fungsi khusus untuk menggambar watermark di layer paling dasar
            const drawWatermark = () => {
                doc.setGState(new doc.GState({ opacity: 1.0 }));
                doc.addImage(watermarkData, 'PNG', x, y, imgWidth, imgHeight);
            };

            // 1. Gambar watermark di halaman PERTAMA sebelum teks & tabel ditulis
            drawWatermark();

            // 2. Tulis Header setelah watermark agar teks berada di atas logo
            doc.setFont("times", "bold");
            doc.setFontSize(11);
            const headerText = source === "luar" ? "DAFTAR PEJABAT LUAR NEGERI" : "DAFTAR PEJABAT DALAM NEGERI";
            doc.text(headerText, pageWidth / 2, 18, { align: "center" });

            doc.setFontSize(12);
            const unitNameLong = unitName ? unitName.toUpperCase() : "UNIT TIDAK DIKETAHUI";
            const splitUnitName = doc.splitTextToSize(unitNameLong, pageWidth - 40);
            doc.text(splitUnitName, pageWidth / 2, 26, { align: "center" });

            let currentY = 26 + splitUnitName.length * 6 + 4;

            // ── GARIS PEMISAH ────────────────────────────────────────────
            doc.setLineWidth(0.4);
            doc.line(15, currentY, pageWidth - 15, currentY);
            currentY += 6;

            doc.setFont("times", "normal");
            doc.setFontSize(10);

            if (unitProfile) {
                const labelX = 15;
                const colonX = 47;
                const valueX = 52;
                const lineH = 5.5;
                const maxValueW = pageWidth - valueX - 15;

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

                drawRow("Alamat", unitProfile.alamat);
                drawRow("No. Telepon", unitProfile.telepon);
                drawRow("Fax", unitProfile.fax);
                drawRow("Email", unitProfile.email);
                drawRow("Website", unitProfile.website);

                if (source === "luar") {
                    drawRow("Hari Kerja", unitProfile.hari_kerja);
                    drawRow("Beda Jam", unitProfile.beda_jam);
                    drawRow("Musim Panas", unitProfile.musim_panas);
                    drawRow("Musim Dingin", unitProfile.musim_dingin);
                }
            } else {
                currentY += 5;
            }

            // 3. Hack: Mencegat fungsi addPage bawaan jsPDF untuk menangani halaman 2 ke atas
            const originalAddPage = doc.addPage.bind(doc);
            doc.addPage = function () {
                originalAddPage();
                drawWatermark();
                return this;
            };

            const tableColumn = ["No.", "Nama Lengkap", "Jabatan", { content: "Alamat & Telepon", colSpan: 3, styles: { halign: 'center' } }];
            const tableRows = [];

            if (sortedUnits.length === 0) {
                tableRows.push([
                    { content: "1.", styles: { valign: 'top', halign: 'center' } },
                    { content: "Data Pejabat Belum Tersedia", colSpan: 5, styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120] } }
                ]);
            } else {
                sortedUnits.forEach((unit, index) => {
                    let contacts = [];
                    const kantor = unit.alamat && unit.alamat !== "-" ? unit.alamat : "s.d.a.";
                    contacts.push({ lbl: "Kantor", val: kantor });
                    if (unit.telepon && unit.telepon !== "-") contacts.push({ lbl: "Telp.", val: unit.telepon });
                    if (unit.fax && unit.fax !== "-") contacts.push({ lbl: "Fax", val: unit.fax });
                    if (unit.no_handphone && unit.no_handphone !== "-") contacts.push({ lbl: "Hp.", val: unit.no_handphone });
                    if (unit.email && unit.email !== "-") contacts.push({ lbl: "Email", val: unit.email });
                    if (unit.wisma && unit.wisma !== "-") contacts.push({ lbl: "Wisma", val: unit.wisma });

                    if (contacts.length === 0) contacts.push({ lbl: "-", val: "-" });

                    const formatNama = unit.nama_pegawai || unit.nama || "-";
                    const formatJab = unit.jabatan || "-";

                    const titleCaseNama = formatNama === "-" ? "-" : formatNama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                    const titleCaseJabatan = formatJab === "-" ? "-" : formatJab.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

                    const span = contacts.length;
                    contacts.forEach((c, cIdx) => {
                        if (cIdx === 0) {
                            tableRows.push([
                                { content: `${index + 1}.`, rowSpan: span, styles: { valign: 'top', halign: 'center' } },
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

            // 4. Generate tabel tanpa didDrawPage (karena sudah di-handle di atas)
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: currentY,
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
                margin: { left: 15, right: 15 }
            });

            const fileName = unitName ? unitName.replace(/\s+/g, "_") : "Semua_Unit";
            doc.setProperties({ title: `Buku_Pejabat_${fileName}.pdf` });

            if (action === 'download') {
                doc.save(`Buku_Pejabat_${fileName}.pdf`);
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'File PDF berhasil diunduh.', confirmButtonColor: '#0ea5e9', timer: 2000, showConfirmButton: false });
                logActivity("DOWNLOAD PDF", `Mengunduh PDF Daftar Pejabat ${unitName || ""}`);
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF berhasil dibuka di tab baru.', confirmButtonColor: '#0ea5e9', timer: 2000, showConfirmButton: false });
                logActivity("PREVIEW PDF", `Preview PDF Daftar Pejabat ${unitName || ""}`);
            }
        } catch (error) {
            console.error("Error creating PDF:", error);
            Swal.fire({ icon: 'error', title: 'Gagal PDF', text: 'Terjadi kesalahan saat membuat PDF.' });
        }
    };

    const isSuperAdmin = localStorage.getItem("user_role") === "superadmin";
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    const userUnitId = userSession.unit_kerja_id;
    const canEdit = isSuperAdmin || Number(unitId) === Number(userUnitId);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 mb-5">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 w-full">
                    {/* BAGIAN KIRI: Judul, Search, dan Export Buttons */}
                    <div className="w-full lg:w-auto">
                        <h2 className="text-base font-bold text-slate-800 uppercase mb-4">
                            <button type="button" onClick={() => navigate(-1)} className="cursor-pointer hover:text-sky-600">
                                Detail Pegawai
                            </button>
                            {unitName && <span className="text-sky-600"> - {unitName}</span>}
                        </h2>

                        {/* Group Search & Export Buttons */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                            {/* Input Search */}
                            <div className="relative w-full md:w-72">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari pegawai..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 w-full bg-slate-50 h-[42px]"
                                />
                            </div>

                            {/* Export Buttons: flex-wrap agar tidak 'penyok' di layar tanggung */}
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                <div className="join border-none shadow-sm rounded-2xl overflow-hidden">
                                    <button onClick={() => downloadPDF('preview')} className="btn btn-md join-item bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-4 min-h-[42px] h-[42px]">
                                        <span className="text-xs font-bold uppercase">Preview</span>
                                    </button>
                                    <button onClick={() => downloadPDF('download')} className="btn btn-md join-item bg-rose-500 hover:bg-rose-600 border-none text-white px-4 min-h-[42px] h-[42px]">
                                        <span className="text-xs font-bold uppercase">Unduh PDF</span>
                                    </button>
                                </div>
                                <button onClick={downloadExcel} className="btn btn-md flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-2xl gap-2 px-5 min-h-[42px] h-[42px]">
                                    <span className="text-xs font-bold uppercase">Excel</span>
                                </button>
                                <button onClick={downloadCSV} className="btn btn-md flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 border-none text-white rounded-2xl gap-2 px-5 min-h-[42px] h-[42px]">
                                    <span className="text-xs font-bold uppercase">CSV</span>
                                </button>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-black tracking-wider">
                        <tr>
                            <th className="px-4 py-4 w-12 text-center">No</th>
                            <th className="px-4 py-4">NIP</th>
                            <th className="px-4 py-4">Nama Lengkap</th>
                            <th className="px-4 py-4">Jabatan</th>
                            <th className="px-4 py-4">Email</th>
                            <th className="px-4 py-4">Telepon</th>
                            {canEdit && <th className="px-4 py-4 w-16 text-center sticky right-0 bg-slate-50">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-10 text-center"><span className="loading loading-spinner text-sky-500"></span></td></tr>
                        ) : sortedUnits.length > 0 ? (
                            currentUnits.map((unit, index) => (
                                <tr key={unit.id || index} className="hover:bg-sky-50/40 transition-colors group">
                                    <td className="px-4 py-3 text-sm text-center text-slate-400 font-bold">{indexOfFirst + index + 1}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-sky-600">{unit.nip || "-"}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-700 uppercase">{unit.nama_pegawai || "-"}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-500">{formatJabatan(unit.jabatan)}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-500 italic lowercase">{unit.email || "-"}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{unit.telepon || "-"}</td>
                                    {canEdit && (
                                        <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-[#f6fbff] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                                            <button onClick={() => openEditModal(unit)} className="btn btn-sm btn-square btn-ghost text-amber-500 hover:bg-amber-100"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg></button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="p-10 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {sortedUnits.length > 0 && (
                <Pagination currentPage={currentPage} totalItems={sortedUnits.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }} />
            )}

            <dialog id="modal_edit_pegawai" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box bg-white max-w-2xl rounded-3xl p-8 border border-slate-100 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">Edit Data Pegawai</h3>
                        <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost text-slate-400">✕</button></form>
                    </div>
                    <form className="space-y-5" onSubmit={handleUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">NIP</label>
                                <input type="text" value={selectedUnit?.nip || ""} className="input input-bordered w-full bg-slate-50 text-slate-500 border-slate-200 rounded-2xl text-sm font-semibold h-12" readOnly />
                            </div>
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nama Lengkap</label>
                                <input type="text" name="nama" defaultValue={selectedUnit?.nama_pegawai || ""} className="input input-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12" />
                            </div>
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email</label>
                                <input type="email" name="email" defaultValue={selectedUnit?.email || ""} className="input input-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12" />
                            </div>
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">No. Telepon</label>
                                <input type="text" name="no_handphone" defaultValue={selectedUnit?.telepon || ""} className="input input-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12" />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest flex items-center gap-2">
                                Jabatan Saat Ini
                            </label>
                            <input type="text" name="jabatan" defaultValue={selectedUnit?.jabatan || ""} className="input input-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12" />
                        </div>

                        <div className="form-control">
                            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Bobot (Prioritas Urutan)</label>
                            <select name="bobot" defaultValue={selectedUnit?.bobot || ""} className="select select-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12">
                                <option value="">Tanpa Bobot Khusus</option>
                                <option value="I">Bobot I (Paling Atas)</option>
                                <option value="II">Bobot II</option>
                                <option value="III">Bobot III</option>
                                <option value="IV">Bobot IV</option>
                            </select>
                            <button type="button" onClick={() => document.getElementById("modal_notes_bobot").showModal()} className="text-blue-500 hover:text-blue-700 text-[10px] italic mt-2 font-bold cursor-pointer text-left ml-2">📖 Info: Bobot akan mengatasi urutan Kode Jabatan</button>
                        </div>

                        <div className="form-control">
                            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Wisma</label>
                            <textarea name="wisma" defaultValue={selectedUnit?.wisma || ""} className="textarea textarea-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold min-h-[80px] py-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">TMT Kedatangan</label>
                                <input type="date" name="tmt_kedatangan" defaultValue={selectedUnit?.tmt_kedatangan || ""} className="input input-bordered w-full bg-white border-slate-200 rounded-2xl text-sm font-semibold h-12" />
                            </div>
                            <div className="form-control">
                                <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">TMT Credential</label>
                                <input type="date" name="tmt_credential" defaultValue={selectedUnit?.tmt_credential || ""} className="input input-bordered w-full bg-white border-slate-200 rounded-2xl text-sm font-semibold h-12" />
                            </div>
                        </div>
                        <div className="modal-action flex gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => document.getElementById("modal_edit_pegawai").close()} className="btn btn-ghost text-slate-400 font-bold uppercase text-[10px]">Batal</button>
                            <button type="submit" disabled={isUpdating} className="btn bg-sky-600 hover:bg-sky-700 border-none text-white px-10 rounded-2xl font-bold text-xs uppercase">{isUpdating ? "Menyimpan..." : "Simpan Perubahan"}</button>
                        </div>
                    </form>
                </div>
            </dialog>

            <dialog id="modal_notes_bobot" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box bg-white max-w-2xl rounded-3xl p-8 border border-slate-100 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">📖 Penjelasan Pengurutan</h3>
                        <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost text-slate-400">✕</button></form>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
                            <p className="text-sm font-bold text-slate-700">Urutan Default: <span className="text-blue-600 font-mono">Kode Jabatan</span> ➔ <span className="text-blue-600 font-mono">Abjad Nama</span></p>
                            <p className="text-xs text-slate-500 mt-1">Jika kolom Bobot diisi, maka pegawai tersebut akan ditarik ke atas mengikuti prioritas bobotnya, mengabaikan kode jabatan.</p>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                            <h4 className="font-bold text-blue-800 text-lg mb-2">Bobot I - IV</h4>
                            <p className="text-sm text-blue-700 leading-relaxed">Digunakan sebagai penanda prioritas manual untuk menyusun daftar pejabat di posisi paling atas.</p>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
}
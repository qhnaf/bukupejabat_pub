import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf"; // TAMBAHAN: Import jsPDF
import autoTable from "jspdf-autotable"; // TAMBAHAN: Import autoTable
import Swal from "sweetalert2"; // TAMBAHAN: Import SweetAlert2
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import LogHistory from "./LogHistory";
import kemluBg from "../assets/images/logo_kemlu_fix.png";

export default function DashboardAdmin() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalPegawai: 0,
        totalKonhor: 0,
        totalUnitDalamNegeri: 0,
        totalUnitLuarNegeri: 0,
        sparkline: [],
        bars: [],
    });

    // Fungsi untuk mendapatkan format YYYY-MM-DD
    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const [publicStats, setPublicStats] = useState([]);
    const [publicStatsStartDate, setPublicStatsStartDate] = useState(formatDate(lastWeek));
    const [publicStatsEndDate, setPublicStatsEndDate] = useState(formatDate(today));

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchPublicStats();
    }, [publicStatsStartDate, publicStatsEndDate]);

    const fetchPublicStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const params = {};
            if (publicStatsStartDate) params.start_date = publicStatsStartDate;
            if (publicStatsEndDate) params.end_date = publicStatsEndDate;

            const response = await axios.get("/api/public-activities/stats", {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.success) {
                const rawData = response.data.data;
                const dateMap = {};

                // Generate all dates between start and end
                if (publicStatsStartDate && publicStatsEndDate) {
                    let current = new Date(publicStatsStartDate);
                    const end = new Date(publicStatsEndDate);
                    while (current <= end) {
                        dateMap[formatDate(current)] = { date: formatDate(current), preview: 0, download: 0 };
                        current.setDate(current.getDate() + 1);
                    }
                }

                rawData.forEach(item => {
                    if (!dateMap[item.date]) {
                        dateMap[item.date] = { date: item.date, preview: 0, download: 0 };
                    }
                    dateMap[item.date][item.type] = item.count;
                });

                // Sort array by date string
                const formattedData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
                setPublicStats(formattedData);
            }
        } catch (error) {
            console.error("Gagal mengambil data statistik publik:", error);
        }
    };

    // Fungsi untuk membuat data tren palsu (untuk chart) yang berakhir di angka total
    const generateTrend = (total, numPoints) => {
        if (!total || total <= 0) return Array(numPoints).fill(0);
        if (total < numPoints) {
            return Array.from({ length: numPoints }, (_, i) => Math.round((i + 1) / numPoints * total));
        }
        const trend = [];
        let current = Math.max(1, Math.floor(total * 0.4)); // Mulai dari 40%
        for (let i = 0; i < numPoints - 1; i++) {
            trend.push(current);
            const step = (total - current) / (numPoints - i);
            current += Math.floor(step * (0.8 + Math.random() * 0.4)); // Naiknya fluktuatif
        }
        trend.push(total); // Titik terakhir selalu angka total aktual
        return trend;
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [dashboardResponse, dalamNegeriResponse, luarNegeriResponse, konhorResponse] =
                await Promise.all([
                    axios.get("/api/dashboard/stats", { headers }),
                    axios.get("/api/unit-kerja/dalam-negeri", { headers }),
                    axios.get("/api/unit-kerja/luar-negeri", { headers }),
                    axios.get("/api/konsul-kehormatan", { headers }),
                ]);

            if (dashboardResponse.data.success) {
                const totPegawai = dashboardResponse.data.data.total_pegawai || 0;
                const totKonhor = konhorResponse.data.data?.length || 0;

                setStats((prev) => ({
                    ...prev,
                    totalPegawai: totPegawai,
                    totalKonhor: totKonhor,
                    totalUnitDalamNegeri: dalamNegeriResponse.data.data?.length || 0,
                    totalUnitLuarNegeri: luarNegeriResponse.data.data?.length || 0,
                    bars: generateTrend(totPegawai, 7), // 7 batang grafik
                    sparkline: generateTrend(totKonhor, 12), // 12 titik area chart
                }));
            }
        } catch (error) {
            console.error("Gagal mengambil data statistik:", error);
        }
    };

    // =======================================================
    // FUNGSI DOWNLOAD PDF: SEMUA PEGAWAI DALAM NEGERI PER SATKER
    // =======================================================
    const downloadPDFDalamNegeri = async (action = 'preview') => {
        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun daftar seluruh pegawai Dalam Negeri...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const unitRes = await axios.get("/api/unit-kerja/dalam-negeri", { headers });
            const unitsDalamNegeri = unitRes.data.data || [];

            const pegRes = await axios.get("/api/pegawai", { headers });
            const allPegawai = pegRes.data.data || [];

            if (unitsDalamNegeri.length === 0) {
                Swal.fire('Informasi', 'Tidak ada data unit kerja Dalam Negeri.', 'info');
                return;
            }

            const allowedKeywords = [
                "menteri", "wakil menteri", "staf ahli", "direktur jenderal", "inspektur jenderal", "kepala badan", "sekretaris badan", "sekretaris jenderal",
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

            unitsDalamNegeri.forEach((unit) => {
                const pejabatForUnit = allPegawai.filter(p => {
                    const jabatanStr = (p.jabatan || "").toLowerCase();
                    const isPejabat = allowedKeywords.some(key => jabatanStr.includes(key));
                    return isPejabat && p.unit_kerja_id === unit.id;
                });

                hasData = true;

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
                const unitNameLong = unit.deskripsi ? unit.deskripsi.toUpperCase() : (unit.nama_unit_kerja ? unit.nama_unit_kerja.toUpperCase() : "UNIT TIDAK DIKETAHUI");
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
                        const formatJab = p.jabatan || "-";

                        const titleCaseNama = formatNama === "-" ? "-" : formatNama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                        const titleCaseJabatan = formatJab === "-" ? "-" : formatJab.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

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
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat untuk diunduh.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Semua_Pegawai_Dalam_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Semua_Pegawai_Dalam_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Dalam Negeri berhasil diunduh.', timer: 2000, showConfirmButton: false });
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF Dalam Negeri berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    // =======================================================
    // FUNGSI DOWNLOAD PDF: SEMUA PEGAWAI LUAR NEGERI PER SATKER
    // =======================================================
    const downloadPDFLuarNegeri = async (action = 'preview') => {
        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun daftar seluruh pegawai Luar Negeri...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const unitRes = await axios.get("/api/unit-kerja/luar-negeri", { headers });
            const unitsLuarNegeri = unitRes.data.data || [];

            const pegRes = await axios.get("/api/pegawai", { headers });
            const allPegawai = pegRes.data.data || [];

            if (unitsLuarNegeri.length === 0) {
                Swal.fire('Informasi', 'Tidak ada data unit kerja Luar Negeri.', 'info');
                return;
            }

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

            unitsLuarNegeri.forEach((unit) => {
                const pejabatForUnit = allPegawai.filter(p => p.unit_kerja_id === unit.id);

                hasData = true;

                if (!isFirstPage) {
                    doc.addPage();
                }
                isFirstPage = false;

                // --- HEADER HALAMAN ---
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.text("DAFTAR PEJABAT LUAR NEGERI", pageWidth / 2, 18, { align: "center" });

                // --- NAMA PANJANG SATKER ---
                doc.setFontSize(12);
                const unitNameLong = unit.deskripsi ? unit.deskripsi.toUpperCase() : (unit.nama_unit_kerja ? unit.nama_unit_kerja.toUpperCase() : "UNIT TIDAK DIKETAHUI");
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

                // --- ISI TABEL ---
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
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat untuk diunduh.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Semua_Pegawai_Luar_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Semua_Pegawai_Luar_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Luar Negeri berhasil diunduh.', timer: 2000, showConfirmButton: false });
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF Luar Negeri berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-md shadow-slate-200/60 p-10 border border-slate-100 text-center">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="inline-block p-4 bg-sky-50 rounded-3xl mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-sky-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-2">
                        Buku Pejabat
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Akses data pegawai dan unduh dokumen resmi buku pejabat
                    </p>
                </div>

                {/* Main Actions (DIUBAH MENJADI CENTER DAN 2 KOLOM) */}
                <div className="flex flex-col md:flex-row justify-center max-w-3xl mx-auto gap-6">
                    {/* BUTTON DALAM NEGERI (DOWNLOAD PDF) */}
                    <div className="group p-8 bg-white border-2 border-slate-100 hover:border-emerald-500 rounded-[28px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-100 flex flex-col items-center gap-6 w-full md:w-1/2">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className="font-black text-slate-800 uppercase tracking-widest text-sm block">
                                Dalam Negeri
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 block tracking-tighter">
                                Laporan Pegawai
                            </span>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                            <button onClick={() => downloadPDFDalamNegeri('preview')} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors">
                                Preview
                            </button>
                            <button onClick={() => downloadPDFDalamNegeri('download')} className="flex-1 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors">
                                Unduh
                            </button>
                        </div>
                    </div>

                    {/* BUTTON LUAR NEGERI (DOWNLOAD PDF) */}
                    <div className="group p-8 bg-white border-2 border-slate-100 hover:border-rose-500 rounded-[28px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-rose-100 flex flex-col items-center gap-6 w-full md:w-1/2">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className="font-black text-slate-800 uppercase tracking-widest text-sm block">
                                Luar Negeri
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 block tracking-tighter">
                                Laporan Pegawai
                            </span>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                            <button onClick={() => downloadPDFLuarNegeri('preview')} className="flex-1 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors">
                                Preview
                            </button>
                            <button onClick={() => downloadPDFLuarNegeri('download')} className="flex-1 py-2.5 bg-rose-500 text-white hover:bg-rose-600 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors">
                                Unduh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-12 text-slate-400 text-xs font-medium uppercase tracking-[4px]">
                    Kementerian Luar Negeri Republik Indonesia
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard title="TOTAL PEGAWAI" value={stats.totalPegawai} tone="slate">
                    <BarChart values={stats.bars} stroke="#a3e635" />
                </StatCard>

                <StatCard
                    title="TOTAL KONHOR"
                    value={stats.totalKonhor}
                    tone="emerald"
                >
                    <Sparkline values={stats.sparkline} stroke="#059669" fill="#d1fae5" />
                </StatCard>

                <StatCard
                    title="UNIT KERJA DALAM NEGERI"
                    value={stats.totalUnitDalamNegeri}
                    tone="amber"
                >
                    <UnitOfficeIcon tone="amber" />
                </StatCard>

                <StatCard
                    title="UNIT KERJA LUAR NEGERI"
                    value={stats.totalUnitLuarNegeri}
                    tone="indigo"
                >
                    <UnitOfficeIcon tone="indigo" />
                </StatCard>
            </div>

            {/* PUBLIC ACTIVITY CHART */}
            {localStorage.getItem("user_role") === "superadmin" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 relative mb-6 mt-6 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Statistik Aktivitas Publik</h3>
                            <p className="text-xs text-slate-500 font-medium">Grafik preview dan unduhan dokumen</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-700"
                                value={publicStatsStartDate}
                                onChange={(e) => setPublicStatsStartDate(e.target.value)}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-700"
                                value={publicStatsEndDate}
                                onChange={(e) => setPublicStatsEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        {publicStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={publicStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                    <Line type="monotone" name="Preview" dataKey="preview" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" name="Download" dataKey="download" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                                Tidak ada data untuk rentang tanggal ini.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {localStorage.getItem("user_role") === "superadmin" && <LogHistory />}
        </div>
    );
}

function UnitOfficeIcon({ tone = "amber" }) {
    const strokeMap = {
        amber: "#b45309",
        indigo: "#4338ca",
    };

    return (
        <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3.75 21h16.5M6 21V7.8c0-.67 0-1.004.13-1.259.114-.224.296-.406.52-.52C6.896 5.9 7.23 5.9 7.9 5.9h8.2c.67 0 1.004 0 1.259.13.224.114.406.296.52.52.13.255.13.589.13 1.259V21M9 10.5h1.5M13.5 10.5H15M9 14.25h1.5M13.5 14.25H15"
                stroke={strokeMap[tone] || strokeMap.amber}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function StatCard({ title, value, children, tone = "slate" }) {
    const toneMap = {
        slate: "bg-slate-50/70",
        emerald: "bg-emerald-50",
        amber: "bg-amber-50",
        indigo: "bg-indigo-50",
    };

    return (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-tight mb-2 max-w-[120px]">
                        {title}
                    </div>
                    <div className="text-3xl font-black text-slate-800 tracking-tight">
                        {value === 0 ? "..." : value}
                    </div>
                </div>
                <div
                    className={`h-16 w-[110px] flex items-center justify-center rounded-[16px] overflow-hidden ${toneMap[tone] || toneMap.slate}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

function Sparkline({ values = [], stroke = "#059669", fill = "#d1fae5" }) {
    if (!values.length) return null;
    const w = 110;
    const h = 64;
    const max = Math.max(...values, 1);

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - (v / max) * (h * 0.7) - 4;
        return { x, y };
    });

    const createPath = (points) => {
        const d = points.reduce((acc, point, i) => i === 0
            ? `M ${point.x},${point.y}`
            : `${acc} L ${point.x},${point.y}`, "");
        return d;
    };

    const d = createPath(points);
    const areaD = `${d} L ${w},${h} L 0,${h} Z`;

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d={areaD} fill={fill} opacity="0.6" />
            <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function BarChart({ values = [], stroke = "#a3e635" }) {
    if (!values.length) return null;
    const w = 110;
    const h = 64;
    const paddingX = 14;
    const paddingY = 10;
    const chartW = w - paddingX * 2;
    const chartH = h - paddingY * 2;

    const max = Math.max(...values, 1);
    const bw = chartW / values.length;

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${w} ${h}`}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <g transform={`translate(${paddingX}, -${paddingY / 2})`}>
                {values.map((v, i) => {
                    const barH = (v / max) * chartH;
                    return (
                        <rect
                            key={i}
                            x={i * bw + bw * 0.15}
                            y={h - barH}
                            width={bw * 0.7}
                            height={barH}
                            rx={2}
                            fill={stroke}
                        />
                    );
                })}
            </g>
        </svg>
    );
}

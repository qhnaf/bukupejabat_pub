import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import kemluBg from "../assets/images/logo-kemlu-flipbook.png";
import FlipbookViewer from "../components/FlipbookViewer";

export default function PublicPage() {
    const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
    const [flipbookTitle, setFlipbookTitle] = useState("");
    const [flipbookData, setFlipbookData] = useState([]);

    // Cache watermark yang sudah dikompres agar tidak diproses ulang setiap kali
    const compressedWatermarkRef = useRef(null);

    /**
     * Kompres gambar watermark: resize ke 200x200 dan convert ke JPEG 60%
     * Hasilnya ~10-20KB vs PNG asli yang bisa 1MB+, sangat mengurangi ukuran PDF
     */
    const compressWatermark = useCallback(() => {
        return new Promise((resolve) => {
            // Gunakan cache jika sudah pernah dikompres
            if (compressedWatermarkRef.current) {
                resolve(compressedWatermarkRef.current);
                return;
            }
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 200; // cukup untuk watermark 100mm di PDF
                    canvas.height = 200;
                    const ctx = canvas.getContext('2d');
                    // Konversi ke hitam putih (grayscale) sebelum embed ke PDF
                    ctx.filter = 'grayscale(100%)';
                    ctx.drawImage(img, 0, 0, 200, 200);
                    ctx.filter = 'none';
                    // JPEG quality 0.6 → ukuran ~10-15KB vs PNG asli
                    const compressed = canvas.toDataURL('image/jpeg', 0.6);
                    compressedWatermarkRef.current = compressed;
                    resolve(compressed);
                } catch (e) {
                    console.error("Failed to compress watermark in PagePublic:", e);
                    resolve(kemluBg);
                }
            };
            img.onerror = () => {
                resolve(kemluBg);
            };
            img.src = kemluBg;
        });
    }, []);

    const trackHit = async (type) => {
        try {
            await axios.post("/api/public-activities/hit", { type });
        } catch (error) {
            console.error("Gagal mencatat log aktivitas:", error);
        }
    };

    const downloadDalamNegeri = async (action = 'preview') => {
        trackHit(action);
        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun daftar pejabat per orang...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Kompres watermark sekali di awal
            const watermarkData = await compressWatermark();

            const [unitsRes, pegawaiRes] = await Promise.all([
                axios.get("/api/unit-kerja/dalam-negeri"),
                axios.get("/api/pegawai")
            ]);
            const filteredUnits = unitsRes.data.data || [];
            const allPegawai = pegawaiRes.data.data || [];

            const allowedKeywords = [
                "menteri", "wakil menteri", "staf ahli", "sekretaris jenderal", "inspektur jenderal", "duta besar", "kepala badan", "kepala pusat",
                "kepala biro", "kepala bagian", "kepala subbagian", "direktur jenderal", "direktur"
            ];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const imgSize = 100; // 1:1 sesuai dimensi asli logo (square)
            const x = (pageWidth - imgSize) / 2;
            const y = (pageHeight - imgSize) / 2;

            const drawWatermark = () => {
                doc.setGState(new doc.GState({ opacity: 0.12 }));
                doc.addImage(watermarkData, 'JPEG', x, y, imgSize, imgSize);
                doc.setGState(new doc.GState({ opacity: 1.0 }));
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

            if (!hasData) {
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Pejabat_Dalam_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Pejabat_Dalam_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Pejabat Dalam Negeri berhasil diunduh.', timer: 2000, showConfirmButton: false });
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF Pejabat Dalam Negeri berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    const downloadLuarNegeri = async (action = 'preview') => {
        trackHit(action);
        Swal.fire({
            title: 'Memproses PDF Luar Negeri...',
            text: 'Sedang menyusun daftar pejabat per orang...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Kompres watermark sekali di awal (gunakan cache jika sudah ada)
            const watermarkData = await compressWatermark();

            const [unitsRes, pegawaiRes] = await Promise.all([
                axios.get("/api/unit-kerja/luar-negeri"),
                axios.get("/api/pegawai")
            ]);

            const filteredUnits = unitsRes.data.data || [];
            const allPegawai = pegawaiRes.data.data || [];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const imgSize = 100; // 1:1 sesuai dimensi asli logo (square)
            const x = (pageWidth - imgSize) / 2;
            const y = (pageHeight - imgSize) / 2;

            const drawWatermark = () => {
                doc.setGState(new doc.GState({ opacity: 0.12 }));
                doc.addImage(watermarkData, 'JPEG', x, y, imgSize, imgSize);
                doc.setGState(new doc.GState({ opacity: 1.0 }));
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
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat.', 'info');
                return;
            }

            doc.setProperties({ title: 'Daftar_Pejabat_Luar_Negeri.pdf' });

            if (action === 'download') {
                doc.save("Daftar_Pejabat_Luar_Negeri.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF Pejabat Luar Negeri berhasil diunduh.', timer: 2000, showConfirmButton: false });
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF Pejabat Luar Negeri berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    const prepareFlipbook = async (type) => {
        trackHit('preview');
        Swal.fire({
            title: 'Menyiapkan Flipbook...',
            text: 'Sedang menyusun halaman digital...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const urlUnits = type === 'dalam' ? "/api/unit-kerja/dalam-negeri" : "/api/unit-kerja/luar-negeri";
            const [unitsRes, pegawaiRes] = await Promise.all([
                axios.get(urlUnits),
                axios.get("/api/pegawai")
            ]);

            const filteredUnits = unitsRes.data.data || [];
            const allPegawai = pegawaiRes.data.data || [];
            const allowedKeywords = [
                "menteri", "wakil menteri", "staf ahli",
                "kepala biro", "kepala bagian", "kepala subbagian"
            ];

            let pages = [];

            filteredUnits.forEach((unit) => {
                let pejabatForUnit = [];
                if (type === 'dalam') {
                    pejabatForUnit = allPegawai.filter(p => {
                        const jabatanStr = (p.jabatan || "").toLowerCase();
                        const isPejabat = allowedKeywords.some(key => jabatanStr.includes(key));
                        return isPejabat && p.unit_kerja_id === unit.id;
                    });
                } else {
                    pejabatForUnit = allPegawai.filter(p => p.unit_kerja_id === unit.id);
                }

                const unitNameLong = unit.deskripsi ? unit.deskripsi.toUpperCase() : (unit.nama_unit_kerja ? unit.nama_unit_kerja.toUpperCase() : "UNIT TIDAK DIKETAHUI");

                if (pejabatForUnit.length === 0) {
                    pages.push({
                        unit: unit,
                        type: type,
                        unitName: unitNameLong,
                        pejabat: [],
                        isLanjutan: false,
                        startIndex: 0
                    });
                } else {
                    // Format pejabat
                    const formattedPejabat = pejabatForUnit.map(p => {
                        let jabatanFormat = p.jabatan || "-";
                        if (type === 'luar' && jabatanFormat.toUpperCase().includes("STAF SK")) {
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

                        return {
                            nama: titleCaseNama,
                            jabatan: titleCaseJabatan,
                            contacts: contacts
                        };
                    });

                    // First page: max 2 pejabat
                    pages.push({
                        unit: unit,
                        type: type,
                        unitName: unitNameLong,
                        pejabat: formattedPejabat.slice(0, 2),
                        isLanjutan: false,
                        startIndex: 0
                    });

                    // Subsequent pages: max 4 pejabat per page
                    for (let i = 2; i < formattedPejabat.length; i += 4) {
                        pages.push({
                            unit: unit,
                            type: type,
                            unitName: `${unitNameLong} (Lanjutan)`,
                            pejabat: formattedPejabat.slice(i, i + 4),
                            isLanjutan: true,
                            startIndex: i
                        });
                    }
                }
            });

            if (pages.length === 0) {
                Swal.fire('Informasi', 'Tidak ditemukan data pejabat.', 'info');
                return;
            }

            setFlipbookTitle(type === 'dalam' ? 'Daftar Pejabat Dalam Negeri' : 'Daftar Pejabat Luar Negeri');
            setFlipbookData(pages);
            Swal.close();
            setIsFlipbookOpen(true);

        } catch (error) {
            console.error("Gagal Flipbook:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data Flipbook.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-grow flex items-center justify-center p-6">
                <div className="max-w-4xl w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 text-center transition-all">
                    <div className="mb-12">
                        <div className="inline-block mb-6">
                            <img src={kemluBg} alt="Logo Kemlu" className="h-24 object-contain" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-2">Portal Unduhan Dokumen Pejabat</h1>
                        <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-1">
                            Data Update{" "}
                            {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date())}{" "}
                            {new Date().getFullYear()}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full px-4 sm:px-0">
                        <div className="group w-full sm:w-64 max-w-sm p-8 bg-white border-2 border-slate-100 hover:border-emerald-500 rounded-[28px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-100 flex flex-col items-center gap-6">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <span className="font-black text-slate-800 uppercase tracking-widest text-sm block">Dalam Negeri</span>
                            </div>
                            <div className="flex flex-col gap-2 w-full mt-2">
                                <button onClick={() => prepareFlipbook('dalam')} className="w-full py-3 bg-sky-400 text-white hover:bg-sky-500 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 shadow-lg shadow-sky-200 flex items-center justify-center gap-2 group/btn border border-sky-400 hover:border-sky-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover/btn:rotate-12 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                    Buka Flipbook
                                </button>
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => downloadDalamNegeri('preview')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors border border-emerald-100">
                                        Preview PDF
                                    </button>
                                    <button onClick={() => downloadDalamNegeri('download')} className="flex-1 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors shadow-sm shadow-emerald-200">
                                        Unduh PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="group w-full sm:w-64 max-w-sm p-8 bg-white border-2 border-slate-100 hover:border-rose-500 rounded-[28px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-rose-100 flex flex-col items-center gap-6">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <span className="font-black text-slate-800 uppercase tracking-widest text-sm block">Luar Negeri</span>
                            </div>
                            <div className="flex flex-col gap-2 w-full mt-2">
                                <button onClick={() => prepareFlipbook('luar')} className="w-full py-3 bg-sky-400 text-white hover:bg-sky-500 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 shadow-lg shadow-sky-200 flex items-center justify-center gap-2 group/btn border border-sky-400 hover:border-sky-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover/btn:rotate-12 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                    Buka Flipbook
                                </button>
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => downloadLuarNegeri('preview')} className="flex-1 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors border border-rose-100">
                                        Preview PDF
                                    </button>
                                    <button onClick={() => downloadLuarNegeri('download')} className="flex-1 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors shadow-sm shadow-rose-200">
                                        Unduh PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-[4px]">
                        Kementerian Luar Negeri Republik Indonesia
                    </p>
                </div>
            </main>

            {/* FLIPBOOK MODAL */}
            {isFlipbookOpen && (
                <FlipbookViewer
                    title={flipbookTitle}
                    pages={flipbookData}
                    bgImage={kemluBg}
                    onClose={() => setIsFlipbookOpen(false)}
                />
            )}
        </div>
    );
}
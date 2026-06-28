import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../components/Pagination";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import kemluBg from "../assets/images/logo_kemlu_fix.png";
import { logActivity } from "../utils/logActivity";
import SearchableSelect from "../components/SearchableSelect";

// ─── Local Data Negara (sementara, nanti diganti GET dari API) ───────────────
const NEGARA_LIST = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina",
    "Armenia", "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh",
    "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil",
    "Brunei Darussalam", "Bulgaria", "Cambodia", "Canada", "Chile", "China",
    "Colombia", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
    "Ecuador", "Egypt", "Ethiopia", "Finland", "France", "Georgia", "Germany",
    "Ghana", "Greece", "Hungary", "India", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
    "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg",
    "Malaysia", "Maldives", "Malta", "Mexico", "Morocco", "Myanmar",
    "Netherlands", "New Zealand", "Nigeria", "North Korea", "Norway", "Oman",
    "Pakistan", "Palestine", "Papua New Guinea", "Peru", "Philippines",
    "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
    "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia",
    "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden",
    "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand", "Timor-Leste",
    "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Uzbekistan", "Venezuela", "Vietnam", "Yemen",
    "Zimbabwe",
];

// ─── Initial Dummy Data ───────────────────────────────────────────────────────
const INITIAL_KONSULS = [
    {
        id: 1,
        negara: "Italy",
        kota: "Napoli",
        alamat: "Via Partenope, 14\n80121 Napoli",
        no_telp: "(+39) 349 7632499",
        fax: "-",
        email: "consolatoindonesia@alice.it",
        website: "-",
        hari_kerja: "Senin – Jumat, 09.00 – 17.00",
    },
    {
        id: 2,
        negara: "Italy",
        kota: "Genoa",
        alamat: "Via Fieschi 8/1\n16121 Genova",
        no_telp: "-",
        fax: "-",
        email: "-",
        website: "-",
        hari_kerja: "Senin – Jumat, 08.00 – 16.00",
    },
    {
        id: 3,
        negara: "Italy",
        kota: "Florence",
        alamat: "Street Pier Capponi no. 87\n50132 Florence",
        no_telp: "+39 055 582 580",
        fax: "+39 055 582 580",
        email: "jacopocappucio@gmail.com",
        website: "www.konsulflorence.it",
        hari_kerja: "Senin – Kamis, 09.00 – 17.00",
    },
];

const INITIAL_PEJABAT = [
    {
        id: 1,
        konsul_id: 1,
        nama: "Mr. Giuseppe Testa",
        gelar_jabatan: "Konsul Kehormatan RI di Napoli",
        alamat: "Via Partenope, 14, 80121 Napoli, Italy",
        no_telp: "(+39) 349 7632499",
    },
    {
        id: 2,
        konsul_id: 2,
        nama: "Dr. Ivo Guidi",
        gelar_jabatan: "Konsul Kehormatan RI di Genoa",
        alamat: "Via Fieschi 8/1, 16121 Genova, Italia",
        no_telp: "-",
    },
    {
        id: 3,
        konsul_id: 3,
        nama: "Mr. Jacopo Cappucio",
        gelar_jabatan: "Konsul Kehormatan RI di Florence",
        alamat: "Street Pier Capponi no. 87, 50132 Florence",
        no_telp: "+39 055 582 580",
    },
];

// ─── Empty form templates ─────────────────────────────────────────────────────
const EMPTY_KONSUL = {
    id: "", negara: "", kota: "", nama_resmi: "", rangkapan: "", alamat: "",
    no_telp: "", fax: "", email: "", website: "", hari_kerja: "",
};
const EMPTY_PEJABAT = {
    id: "", konsul_id: "", nama: "", gelar_jabatan: "", alamat: "", no_telp: "",
};

// ─── Reusable Field Components ────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div className="form-control">
        <label className="text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const inputCls =
    "input input-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12";
const textareaCls =
    "textarea textarea-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold min-h-[90px] py-3";

// ─── MODAL: Tambah / Edit Konsul Kehormatan ───────────────────────────────────
function KonsulModal({ isOpen, isEditing, data, onChange, onSubmit, onClose, isSaving, user }) {
    const modalRef = useRef(null);

    // Deteksi apakah inputan harus dikunci
    const unitName = user?.unit_kerja?.nama_unit_kerja || "";
    const isLocked = !isEditing && user?.role !== 'superadmin' && unitName.toUpperCase().startsWith('KBRI');

    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        if (isOpen && !modal.open) {
            modal.showModal();
        }

        if (!isOpen && modal.open) {
            modal.close();
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <dialog
            ref={modalRef}
            className="modal modal-bottom sm:modal-middle"
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <div className="modal-box bg-white max-w-2xl rounded-3xl p-8 border border-slate-100 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">
                        {isEditing ? "Edit Konsul Kehormatan" : "Tambah Konsul Kehormatan"}
                    </h3>
                    <button type="button" onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-slate-400">x</button>
                </div>

                {/* Body */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Negara */}
                    <Field label="Negara" required>
                        <SearchableSelect
                            options={[
                                { value: "", label: "-- Pilih Negara --" },
                                ...NEGARA_LIST.map(n => ({ value: n, label: n }))
                            ]}
                            value={data.negara}
                            onChange={(val) => onChange({ target: { name: 'negara', value: val } })}
                            placeholder="-- Pilih Negara --"
                            className="select select-bordered w-full bg-white text-slate-800 border-slate-200 focus:ring-4 focus:ring-sky-100 transition-all rounded-2xl text-sm font-semibold h-12 px-4"
                        />
                    </Field>

                    {/* Kota */}
                    <Field label="Kota" required>
                        <input
                            type="text"
                            name="kota"
                            value={data.kota}
                            onChange={onChange}
                            required
                            placeholder="Contoh: Napoli"
                            className={inputCls}
                        />
                    </Field>

                    {/* Nama Resmi & Rangkapan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Nama Resmi">
                            <input
                                type="text"
                                name="nama_resmi"
                                value={data.nama_resmi || ""}
                                onChange={onChange}
                                placeholder="Contoh: Konsulat Kehormatan RI..."
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Rangkapan">
                            <input
                                type="text"
                                name="rangkapan"
                                value={data.rangkapan || ""}
                                onChange={onChange}
                                placeholder="Wilayah rangkapan"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    {/* Alamat */}
                    <Field label="Alamat" required>
                        <textarea
                            name="alamat"
                            value={data.alamat}
                            onChange={onChange}
                            required
                            rows={3}
                            placeholder={"Contoh:\nVia Partenope, 14\n80121 Napoli"}
                            className={textareaCls}
                        />
                    </Field>

                    {/* No. Telp & Fax */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="No. Telepon">
                            <input
                                type="text"
                                name="no_telp"
                                value={data.no_telp}
                                onChange={onChange}
                                placeholder="+62 21 xxxxxxxx"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Fax">
                            <input
                                type="text"
                                name="fax"
                                value={data.fax}
                                onChange={onChange}
                                placeholder="+62 21 xxxxxxxx"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    {/* Email & Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Email">
                            <input
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={onChange}
                                placeholder="contoh@email.com"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Website">
                            <input
                                type="text"
                                name="website"
                                value={data.website}
                                onChange={onChange}
                                placeholder="www.example.com"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    {/* Hari Kerja */}
                    <Field label="Hari Kerja">
                        <input
                            type="text"
                            name="hari_kerja"
                            value={data.hari_kerja}
                            onChange={onChange}
                            placeholder="Contoh: Senin – Jumat, 09.00 – 17.00"
                            className={inputCls}
                        />
                    </Field>

                    {/* Footer */}
                    <div className="modal-action flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost text-slate-400 font-bold uppercase text-[10px]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn bg-sky-600 hover:bg-sky-700 border-none text-white px-10 rounded-2xl font-bold text-xs uppercase"
                        >
                            {isSaving ? "Menyimpan..." : isEditing ? "Update" : "Tambah"}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function KonsulKehormatan() {
    const navigate = useNavigate();

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

    // ── Data State ──
    const [konsuls, setKonsuls] = useState([]);
    const [pejabats, setPejabats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // ── Search & Pagination ──
    const [searchKonsul, setSearchKonsul] = useState("");
    const [pageKonsul, setPageKonsul] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // ── Konsul Modal State ──
    const [konsulModal, setKonsulModal] = useState(false);
    const [isEditingKonsul, setIsEditingKonsul] = useState(false);
    const [konsulForm, setKonsulForm] = useState(EMPTY_KONSUL);
    const [savingKonsul, setSavingKonsul] = useState(false);

    // ── Fetch (dummy) ──
    useEffect(() => { 
        fetchAll(); 
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        setPageKonsul(1);
    }, [searchKonsul]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [r1, r2] = await Promise.all([
                axios.get("/api/konsul-kehormatan", { headers }),
                axios.get("/api/pejabat-konsul", { headers })
            ]);

            if (r1.data.success) setKonsuls(r1.data.data);
            if (r2.data.success) setPejabats(r2.data.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            Swal.fire({ icon: "error", title: "Oops...", text: "Gagal mengambil data. Pastikan Anda sudah login.", confirmButtonColor: "#0ea5e9" });
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ──
    const nextId = (arr) => arr.length > 0 ? Math.max(...arr.map((x) => x.id)) + 1 : 1;

    // Cek apakah user boleh edit/hapus konsul ini
    const canEditKonsul = (k) => {
        if (!user) return false;
        if (user.role === 'superadmin') return true;
        // gunakan == agar integer vs string tidak masalah
        return k.unit_kerja_id != null && user.unit_kerja_id != null &&
            k.unit_kerja_id == user.unit_kerja_id;
    };

    // ════════════════════════ KONSUL CRUD ════════════════════════
    const openAddKonsul = () => {
        let initialForm = { ...EMPTY_KONSUL };
        
        // Auto-fill jika login sebagai KBRI
        const unitName = user?.unit_kerja?.nama_unit_kerja || "";
        if (user && user.role !== 'superadmin' && unitName.toUpperCase().startsWith('KBRI')) {
            const cityName = unitName.replace(/KBRI/i, '').trim();
            // Ubah menjadi Title Case (misal: TOKYO -> Tokyo)
            const formattedCity = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
            initialForm.negara = formattedCity;
            initialForm.kota = formattedCity;
        }

        setKonsulForm(initialForm);
        setIsEditingKonsul(false);
        setKonsulModal(true);
    };

    const openEditKonsul = (k) => {
        setKonsulForm({ ...k });
        setIsEditingKonsul(true);
        setKonsulModal(true);
    };

    const handleKonsulChange = (e) => {
        const { name, value } = e.target;
        setKonsulForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleKonsulSubmit = async () => {
        if (!konsulForm.negara || !konsulForm.kota || !konsulForm.alamat) {
            Swal.fire({ icon: "warning", title: "Peringatan", text: "Negara, Kota, dan Alamat wajib diisi.", confirmButtonColor: "#0ea5e9" });
            return;
        }
        setSavingKonsul(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            if (isEditingKonsul) {
                await axios.put(`/api/konsul-kehormatan/${konsulForm.id}`, konsulForm, { headers });
                fetchAll();
                logActivity("UPDATE", `Memperbarui Konsul Kehormatan: ${konsulForm.kota}, ${konsulForm.negara}`);
            } else {
                await axios.post("/api/konsul-kehormatan", konsulForm, { headers });
                fetchAll();
                logActivity("CREATE", `Menambah Konsul Kehormatan: ${konsulForm.kota}, ${konsulForm.negara}`);
            }
            setKonsulModal(false);
            setPageKonsul(1);
            Swal.fire({ icon: "success", title: "Berhasil!", text: isEditingKonsul ? "Data Konsul Kehormatan berhasil diperbarui." : "Data Konsul Kehormatan berhasil ditambahkan.", confirmButtonColor: "#0ea5e9" });
        } catch {
            Swal.fire({ icon: "error", title: "Oops...", text: "Gagal menyimpan data.", confirmButtonColor: "#0ea5e9" });
        } finally {
            setSavingKonsul(false);
        }
    };

    const handleDeleteKonsul = (id) => {
        Swal.fire({
            title: "Hapus Konsul Kehormatan?",
            text: "Data konsul beserta pejabat terkait akan dihapus permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem("token");
                    await axios.delete(`/api/konsul-kehormatan/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchAll();
                    setPageKonsul(1);
                    Swal.fire({ icon: "success", title: "Berhasil!", text: "Data Konsul Kehormatan berhasil dihapus.", confirmButtonColor: "#0ea5e9" });
                    logActivity("DELETE", "Menghapus Konsul Kehormatan");
                } catch {
                    Swal.fire({ icon: "error", title: "Oops...", text: "Gagal menghapus data.", confirmButtonColor: "#0ea5e9" });
                }
            }
        });
    };

    // ── Filtered & Paginated ──
    const filteredKonsuls = konsuls.filter((k) => {
        const s = searchKonsul.toLowerCase();
        return (
            (k.negara || "").toLowerCase().includes(s) ||
            (k.kota || "").toLowerCase().includes(s) ||
            (k.alamat || "").toLowerCase().includes(s) ||
            (k.email || "").toLowerCase().includes(s)
        );
    });
    const totalPagesKonsul = Math.max(1, Math.ceil(filteredKonsuls.length / itemsPerPage));
    const currentKonsuls = filteredKonsuls.slice((pageKonsul - 1) * itemsPerPage, pageKonsul * itemsPerPage);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPagesKonsul) return;
        setPageKonsul(page);
        window.scrollTo(0, 0);
    };

    const downloadPDF = async (action = 'preview') => {
        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun daftar pejabat Konsul Kehormatan...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const watermarkData = await compressWatermark();
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            const imgWidth = 200;
            const imgHeight = 140;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            const drawWatermark = () => {
                doc.setGState(new doc.GState({ opacity: 1.0 }));
                doc.addImage(watermarkData, 'PNG', x, y, imgWidth, imgHeight);
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

            filteredKonsuls.forEach((k) => {
                const pejabatForKonsul = pejabats.filter(p => p.konsul_id === k.id);

                hasData = true;

                if (!isFirstPage) {
                    doc.addPage();
                }
                isFirstPage = false;

                // --- HEADER HALAMAN ---
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.text("DAFTAR PEJABAT KONSUL KEHORMATAN", pageWidth / 2, 18, { align: "center" });

                // --- NAMA KOTA DAN NEGARA ---
                doc.setFontSize(12);
                const konsulNameLong = `${k.kota}, ${k.negara}`.toUpperCase();
                const splitKonsulName = doc.splitTextToSize(konsulNameLong, pageWidth - 40);
                doc.text(splitKonsulName, pageWidth / 2, 26, { align: "center" });

                let currentY = 26 + splitKonsulName.length * 6 + 4;

                // ── GARIS PEMISAH ────────────────────────────────────────────
                doc.setLineWidth(0.4);
                doc.line(15, currentY, pageWidth - 15, currentY);
                currentY += 6;

                // ── HELPER: cetak baris label : nilai (format surat resmi) ──
                const labelX   = 15;   // mulai label
                const colonX   = 47;   // posisi titik dua
                const valueX   = 52;   // mulai nilai
                const maxValueW = pageWidth - valueX - 15; // lebar maks nilai
                const lineH    = 5.5;  // jarak antar baris

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

                drawRow("Alamat", k.alamat);
                drawRow("No. Telepon", k.no_telp);
                drawRow("Fax", k.fax);
                drawRow("Email", k.email);
                drawRow("Website", k.website);
                drawRow("Hari Kerja", k.hari_kerja);

                // --- ISI TABEL ---
                const tableRows = [];
                if (pejabatForKonsul.length === 0) {
                    tableRows.push([
                        { content: "1.", styles: { valign: 'top', halign: 'center' } },
                        { content: "Data Pejabat Belum Tersedia", colSpan: 5, styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120] } }
                    ]);
                } else {
                    pejabatForKonsul.forEach((p, i) => {
                        const formatNama = p.nama ? p.nama.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()) : "-";
                        
                        let contacts = [];
                        const kantor = p.alamat && p.alamat !== "-" ? p.alamat : "s.d.a.";
                        contacts.push({ lbl: "Kantor", val: kantor });
                        if (p.telp || p.no_telp || p.telepon) contacts.push({ lbl: "Telp.", val: (p.telp || p.no_telp || p.telepon) });
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
                                    { content: formatNama, rowSpan: span, styles: { valign: 'top' } },
                                    { content: p.gelar_jabatan || "-", rowSpan: span, styles: { valign: 'top' } },
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

            doc.setProperties({ title: 'Daftar_Konsul_Kehormatan.pdf' });
            
            if (action === 'download') {
                doc.save("Daftar_Konsul_Kehormatan.pdf");
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF berhasil diunduh.', timer: 2000, showConfirmButton: false });
                logActivity("DOWNLOAD PDF", "Mengunduh PDF Daftar Konsul Kehormatan");
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
                logActivity("PREVIEW PDF", "Preview PDF Daftar Konsul Kehormatan");
            }

        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 p-6 animate-in fade-in duration-500">
                {/* Header dengan Pencarian */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                            Daftar Konsul Kehormatan
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Total {filteredKonsuls.length} data tersedia</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Kotak Pencarian */}
                        <div className="relative w-full sm:w-64">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari negara / kota..."
                                value={searchKonsul}
                                onChange={(e) => { setSearchKonsul(e.target.value); setPageKonsul(1); }}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full bg-slate-50"
                            />
                        </div>

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

                        <button
                            onClick={openAddKonsul}
                            className="px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            + Tambah Konsul
                        </button>
                    </div>
                </div>

                {/* Looping Data (Accordion) */}
                {loading ? (
                    <div className="text-center p-10">
                        <p className="text-sm text-slate-400">Memuat data...</p>
                    </div>
                ) : currentKonsuls.length > 0 ? (
                    <div className="space-y-3">
                        {currentKonsuls.map((k) => {
                            const pejabatCount = pejabats.filter((p) => p.konsul_id === k.id).length;
                            return (
                                <details key={k.id} className="group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                                        <span className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                                            {k.kota}, {k.negara}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4 text-slate-400 group-open:rotate-180 transition-transform">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </summary>

                                    <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                                        {/* Detail Row (Scrollable Horizontal) */}
                                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                                            <div className="flex flex-nowrap gap-8 text-[14px] items-stretch min-w-max">
                                            {/* Info Tambahan */}
                                            <div className="flex-1 min-w-[150px]">
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">Nama Resmi</p>
                                                <p className="text-slate-700 font-semibold mb-3">{k.nama_resmi || "-"}</p>
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">Rangkapan</p>
                                                <p className="text-slate-700 text-sm">{k.rangkapan || "-"}</p>
                                            </div>
                                            {/* Alamat */}
                                            <div className="flex-1 min-w-[130px]">
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">Alamat</p>
                                                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{k.alamat || "-"}</p>
                                            </div>
                                            {/* No. Telepon */}
                                            <div className="flex-1 min-w-[150px]">
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">No. Telepon</p>
                                                <p className="text-slate-700 font-semibold">{k.no_telp || "-"}</p>
                                                {k.fax && k.fax !== "-" && (
                                                    <>
                                                        <p className="font-bold text-slate-400 uppercase mt-2 mb-1 text-xs">Fax</p>
                                                        <p className="text-slate-500 italic text-xs">{k.fax}</p>
                                                    </>
                                                )}
                                            </div>
                                            {/* Email & Website */}
                                            <div className="flex-1 min-w-[150px]">
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">Email</p>
                                                {k.email && k.email !== "-" ? (
                                                    <a href={`mailto:${k.email}`} className="text-sky-600 font-bold underline break-all whitespace-normal text-sm">{k.email}</a>
                                                ) : <p className="text-slate-400 text-sm">-</p>}
                                                {k.website && k.website !== "-" && (
                                                    <>
                                                        <p className="font-bold text-slate-400 uppercase mt-2 mb-1 text-xs">Website</p>
                                                        {/* <p className="text-slate-400 break-all whitespace-normal text-sm">{k.website}</p> */}
                                                        <a href={k.website?.startsWith('http') ? k.website : `https://${k.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline break-all hover:text-sky-700 transition-colors">{k.website || "-"}</a>
                                                    </>
                                                )}
                                            </div>
                                            {/* Hari Kerja */}
                                            <div className="flex-1 min-w-[150px]">
                                                <p className="font-bold text-slate-400 uppercase mb-1 text-xs">Hari Kerja</p>
                                                <p className="text-slate-700 text-sm">{k.hari_kerja || "-"}</p>
                                            </div>
                                            {/* Aksi */}
                                            <div className="sticky right-0 z-10 bg-white/95 backdrop-blur-sm pl-6 pr-2 py-1 border-l border-slate-100 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] flex flex-col items-center" style={{ minWidth: canEditKonsul(k) ? "100px" : "60px" }}>
                                                <p className="font-bold text-slate-400 uppercase mb-2 text-xs text-center">Aksi</p>
                                                <div className="flex gap-1.5">
                                                    {canEditKonsul(k) && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); openEditKonsul(k); }}
                                                        className="btn btn-sm btn-square btn-ghost text-amber-500 hover:bg-amber-100"
                                                        title="Edit Konsul Kehormatan"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                                        </svg>
                                                    </button>
                                                    )}
                                                    {canEditKonsul(k) && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); handleDeleteKonsul(k.id); }}
                                                        className="btn btn-sm btn-square btn-ghost text-red-400 hover:bg-red-100"
                                                        title="Hapus Konsul Kehormatan"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        </div>

                                        {/* Klik Detail Bar */}
                                        <div
                                            onClick={() => navigate(`/konsul-kehormatan/${k.id}`)}
                                            className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-sky-100 transition-colors"
                                        >
                                            <span className="text-[12px] font-bold text-sky-700 uppercase">
                                                Daftar Personel ({pejabatCount})
                                            </span>
                                            <span className="text-sky-400 text-[11px] font-bold uppercase">
                                                Klik Detail ➔
                                            </span>
                                        </div>
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tidak ada konsul kehormatan yang ditemukan.
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredKonsuls.length > 0 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={pageKonsul}
                            totalItems={filteredKonsuls.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={(newSize) => {
                                setItemsPerPage(newSize);
                                setPageKonsul(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            <KonsulModal
                isOpen={konsulModal}
                isEditing={isEditingKonsul}
                data={konsulForm}
                user={user}
                onChange={handleKonsulChange}
                onSubmit={handleKonsulSubmit}
                onClose={() => setKonsulModal(false)}
                isSaving={savingKonsul}
            />
        </div>
    );
}

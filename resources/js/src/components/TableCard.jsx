import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";

export default function TableCard() {
    // 1. State Utama
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUnitKode, setSelectedUnitKode] = useState("");
    const [selectedUnitName, setSelectedUnitName] = useState("");
    const [unitSearchTerm, setUnitSearchTerm] = useState("");
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);

    // Unit Kerja list (diambil dari API)
    const [unitList, setUnitList] = useState([]);

    // Filter unit kerja berdasarkan search term (client-side fallback)
    const filteredUnitList = unitList.filter((u) =>
        (u.nama || "").toLowerCase().includes(unitSearchTerm.toLowerCase()),
    );

    // 2. State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // 3. State Modal
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    // Ambil data dari API saat pertama kali load
    useEffect(() => {
        fetchData();
        fetchUnitKerja("");
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mengambil data dari API Laravel lokal Anda
            const response = await axios.get(
                "/api/pegawai",
            );

            // Mapping data dari Database ke variabel state yang ada di UI
            const dbData = response.data.data || [];
            const formattedData = dbData.map((item) => ({
                ...item, // Bawa semua data asli
                nama: item.nama_pegawai || item.nama || "-",
                kd_unker: item.unit_kerja?.kode_unit_kerja || item.unit_kerja_id || "",
                ket_unker:
                    item.unit_kerja?.deskripsi ||
                    item.unit_kerja?.nama_unit_kerja ||
                    item.deskripsi ||
                    item.nama_unit_kerja ||
                    "-",
                Jabatan: typeof item.jabatan === 'string' ? item.jabatan : (item.jabatan?.nama_jabatan || item.jabatan || "-"),
                LokasiKerjaName: item.alamat || "-",
                no_hp: item.no_handphone || item.telepon || "-",
            }));

            setData(formattedData);

            // Fallback list unit jika unitList belum terisi
            if (
                (!unitList || unitList.length === 0) &&
                formattedData.length > 0
            ) {
                const built = buildUnitsFromData(formattedData);
                setUnitList(built);
            }
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Bangun daftar unit unik dari data pegawai
    const buildUnitsFromData = (allData) => {
        const map = new Map();
        allData.forEach((d) => {
            const kode =
                d.kd_unker ||
                d.idLokasiKerja ||
                d.kd_jabatan ||
                (d.ket_unker || "").trim();
            const nama = (d.ket_unker || d.LokasiKerjaName || "").trim();
            const key = kode || nama;
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, { kd_unker: kode || key, nama: nama || key });
            }
        });
        return Array.from(map.values()).sort((a, b) =>
            (a.nama || "").localeCompare(b.nama || ""),
        );
    };

    const fetchUnitKerja = async (q = "") => {
        try {
            const response = await axios.get(
                "/api/unit-kerja",
                { params: { search: q, limit: 100 } },
            );

            // Mapping unit kerja dari DB
            const dbUnits = response.data.data || [];
            const formattedUnits = dbUnits.map((u) => ({
                ...u,
                kd_unker: u.kode_unit_kerja,
                nama: u.deskripsi || u.nama_unit_kerja,
            }));

            setUnitList(formattedUnits);
        } catch (error) {
            console.error("Gagal mengambil data unit kerja:", error);
        }
    };

    // Debounce unit search
    useEffect(() => {
        const t = setTimeout(() => {
            fetchUnitKerja(unitSearchTerm);
        }, 300);
        return () => clearTimeout(t);
    }, [unitSearchTerm]);

    // --- LOGIKA SEARCH ---
    const filteredData = data.filter((item) => {
        const searchStr = searchTerm.toLowerCase();
        const unitMatch =
            selectedUnitKode === "" || item.kd_unker === selectedUnitKode;

        return (
            unitMatch &&
            (item.nama?.toLowerCase().includes(searchStr) ||
                item.nip?.toString().toLowerCase().includes(searchStr) ||
                item.Jabatan?.toString().toLowerCase().includes(searchStr) ||
                item.ket_unker?.toString().toLowerCase().includes(searchStr))
        );
    });

    // --- LOGIKA SORTING CUSTOM ---
    const getKeywordRank = (jabatan) => {
        const j = (jabatan || "").toLowerCase();

        if (j.includes("menteri") && !j.includes("wakil menteri")) return 1;
        if (j.includes("wakil menteri")) return 2;
        if (j.includes("sekretaris jenderal") || j.includes("direktur jenderal") || j.includes("inspektur jenderal") || j.includes("kepala badan")) return 3;
        if (j.includes("staf ahli")) return 4;
        if (j.includes("kepala biro") || j.includes("direktur") || j.includes("inspektur") || j.includes("kepala pusat")) return 5;
        if (j.includes("duta besar") || j.includes("kedutaan besar ri")) return 6;
        if (j.includes("wakepri") || j.includes("wakil kepala perwakilan")) return 7;
        if (j.includes("konsul jenderal") || j.includes("konsul")) return 8;
        if (j.includes("kepala bagian")) return 9;
        if (j.includes("kepala subbag") || j.includes("kepala subbagian")) return 10;
        
        return 99;
    };

    const sortedData = [...filteredData].sort((a, b) => {
        const rankA = getKeywordRank(a.Jabatan);
        const rankB = getKeywordRank(b.Jabatan);

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        // Jika hierarki jabatannya sama (misal sama-sama staff/99), urutkan berdasarkan nama abjad
        return (a.nama || "").localeCompare(b.nama || "");
    });

    // --- LOGIKA PAGINATION ---
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-sm border border-slate-200">
                <span className="loading loading-spinner loading-lg text-info"></span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 font-sans">
            {/* Header: Judul (Kiri) & Search/Refresh (Kanan) */}
            <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-slate-100 gap-4">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800">
                        Data Pejabat
                    </h2>
                    {/* <span className="text-xs text-slate-500">
                        {searchTerm
                            ? `Ditemukan ${sortedData.length} hasil`
                            : `Total ${data.length} pegawai`}
                    </span> */}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                    <button
                        onClick={fetchData}
                        className="btn btn-sm btn-ghost border border-slate-300 rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                        </svg>
                        Refresh
                    </button>

                    {/* Searchable Unit Kerja Dropdown */}
                    <div className="relative w-full md:w-48">
                        <label className="input input-sm bg-white border border-slate-300 text-slate-600 rounded-xl flex items-center gap-2 focus-within:border-sky-500 transition-all">
                            <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                            >
                                <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.3-4.3"></path>
                                </g>
                            </svg>
                            <input type="text" placeholder="Cari unit kerja..." className="grow" value={unitSearchTerm || selectedUnitName} onChange={(e) => {
                                    setUnitSearchTerm(e.target.value);
                                    setShowUnitDropdown(true);
                                }}
                                onFocus={() => setShowUnitDropdown(true)}
                                onBlur={() =>
                                    setTimeout(
                                        () => setShowUnitDropdown(false),
                                        200,
                                    )
                                }
                            />
                            {selectedUnitName && (
                                <button
                                    onClick={() => {
                                        setSelectedUnitKode("");
                                        setSelectedUnitName("");
                                        setUnitSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </label>

                        {/* Dropdown List */}
                        {showUnitDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setSelectedUnitKode("");
                                            setSelectedUnitName("");
                                            setUnitSearchTerm("");
                                            setShowUnitDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Semua Unit Kerja
                                    </button>
                                    {filteredUnitList.length > 0 ? (
                                        filteredUnitList.map((unit, idx) => (
                                            <button
                                                key={
                                                    unit.kd_unker ||
                                                    unit.id ||
                                                    idx
                                                }
                                                onClick={() => {
                                                    const kode =
                                                        unit.kd_unker ||
                                                        unit.kode ||
                                                        unit.id ||
                                                        "";
                                                    const name =
                                                        unit.nama ||
                                                        unit.name ||
                                                        kode;
                                                    setSelectedUnitKode(kode);
                                                    setSelectedUnitName(name);
                                                    setUnitSearchTerm(name);
                                                    setShowUnitDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                                    selectedUnitKode ===
                                                    (unit.kd_unker ||
                                                        unit.id ||
                                                        "")
                                                        ? "bg-sky-500 text-white"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                {unit.nama ||
                                                    unit.name ||
                                                    unit.kd_unker ||
                                                    unit.id}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-slate-400 italic">
                                            Tidak ada yang cocok
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <label className="input input-sm bg-white border border-slate-300 text-slate-600 rounded-xl flex items-center gap-2 focus-within:border-sky-500 transition-all w-full md:w-64">
                        <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                            </g>
                        </svg>
                        <input type="search" placeholder="Cari nama atau NIP..." className="grow" value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="p-4 border-b border-slate-100">
                                No
                            </th>
                            <th className="p-4 border-b border-slate-100">
                                NIP / Nama
                            </th>
                            <th className="p-4 border-b border-slate-100">
                                Jabatan
                            </th>
                            <th className="p-4 border-b border-slate-100">
                                Unit Kerja
                            </th>
                            <th className="p-4 border-b border-slate-100">
                                Kontak
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.length > 0 ? (
                            currentItems.map((r, index) => {
                                const realNumber = indexOfFirstItem + index + 1;
                                return (
                                    <tr
                                        key={r.nip || index}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="p-4 text-sm text-slate-500 w-12">
                                            {realNumber}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {r.nama}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {r.nip?.trim()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col max-w-xs gap-1">
                                                <span
                                                    className="text-sm font-semibold text-slate-700"
                                                    title={r.Jabatan}
                                                >
                                                    {r.Jabatan || "-"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className="text-sm text-slate-600"
                                                title={r.ket_unker}
                                            >
                                                {r.ket_unker || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            <div className="flex flex-col gap-2">
                                                <span>
                                                    📞{" "}
                                                    {r.no_hp &&
                                                    r.no_hp !== "-" ? (
                                                        r.no_hp
                                                    ) : (
                                                        <span className="italic text-slate-400 font-semibold whitespace-nowrap">
                                                            Nomor belum diisi
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    📍{" "}
                                                    {r.LokasiKerjaName ||
                                                        "Tidak tersedia"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex gap-2">

                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400 font-medium italic">
                                    Data tidak ditemukan...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 font-medium">
                            Tampilkan
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="select select-bordered select-sm bg-white border rounded-xl border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-slate-600 font-medium">
                            per halaman
                        </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-slate-600 font-medium">
                            Menampilkan {indexOfFirstItem + 1}–
                            {Math.min(indexOfLastItem, sortedData.length)} dari{" "}
                            {sortedData.length} pegawai
                        </span>
                        <span className="text-xs text-slate-500">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-1 flex-wrap">
                    <button onClick={handlePrev} disabled={currentPage === 1}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        ← Sebelumnya
                    </button>

                    {getPageNumbers().map((page, idx) => (
                        <button
                            key={idx}
                            onClick={() =>
                                typeof page === "number" && setCurrentPage(page)
                            }
                            disabled={page === "..."}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                page === currentPage
                                    ? "bg-blue-600 text-white"
                                    : page === "..."
                                      ? "text-slate-400 cursor-default"
                                      : "border border-slate-300 text-slate-600 hover:bg-slate-300"
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button onClick={handleNext} disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Selanjutnya →
                    </button>
                </div>
            </div>

            {/* Modal Components */}
            <Modal
                open={isEditOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Pegawai"
            >
                {selectedRow && (
                    <EditForm
                        initialData={selectedRow}
                        onCancel={() => setEditOpen(false)}
                        onSave={() => setEditOpen(false)}
                    />
                )}
            </Modal>

            <ConfirmModal
                open={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => {
                    // Logika hapus dummy
                    setData((prev) =>
                        prev.filter((item) => item !== selectedRow),
                    );
                    setDeleteOpen(false);
                }}
                message={`Yakin ingin menghapus ${selectedRow?.nama}?`}
            />
        </div>
    );
}

// Form Edit Sederhana
function EditForm({ initialData, onCancel, onSave }) {
    const [form, setForm] = useState({ ...initialData });

    const handleInputChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave && onSave(form);
            }}
            className="space-y-4"
        >
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nama
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.nama || ""}
                        onChange={(e) =>
                            handleInputChange("nama", e.target.value)
                        }
                        placeholder="Masukkan nama"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        NIP
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.nip || ""}
                        onChange={(e) =>
                            handleInputChange("nip", e.target.value)
                        }
                        placeholder="Masukkan NIP"
                    />
                </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Unit Kerja
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.ket_unker || ""}
                        onChange={(e) =>
                            handleInputChange("ket_unker", e.target.value)
                        }
                        placeholder="Masukkan unit kerja"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Jabatan
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.Jabatan || ""}
                        onChange={(e) =>
                            handleInputChange("Jabatan", e.target.value)
                        }
                        placeholder="Masukkan jabatan"
                    />
                </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        No. Telepon
                    </label>
                    <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.no_hp || ""}
                        onChange={(e) =>
                            handleInputChange("no_hp", e.target.value)
                        }
                        placeholder="Masukkan nomor telepon"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {" "}
                        Lokasi
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.LokasiKerjaName || ""}
                        onChange={(e) =>
                            handleInputChange("LokasiKerjaName", e.target.value)
                        }
                        placeholder="Masukkan lokasi"
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                    Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Simpan Perubahan
                </button>
            </div>
        </form>
    );
}

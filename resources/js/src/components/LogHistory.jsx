import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

export default function LogHistory() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // State untuk Date Range
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            
            const response = await axios.get("/api/activity-logs", {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil log:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [startDate, endDate]);

    const handleExportPDF = (action = 'preview') => {
        if (filteredLogs.length === 0) {
            Swal.fire('Informasi', 'Tidak ada data log aktivitas untuk diekspor.', 'info');
            return;
        }

        Swal.fire({
            title: 'Memproses PDF...',
            text: 'Sedang menyusun dokumen log aktivitas...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text("LOG AKTIVITAS SISTEM", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.text("Kementerian Luar Negeri Republik Indonesia", pageWidth / 2, 26, { align: "center" });

            let subtitle = "Seluruh Data";
            if (startDate && endDate) subtitle = `Periode: ${startDate} s.d ${endDate}`;
            else if (startDate) subtitle = `Mulai: ${startDate}`;
            else if (endDate) subtitle = `Hingga: ${endDate}`;

            doc.setFont("times", "italic");
            doc.text(subtitle, pageWidth / 2, 32, { align: "center" });

            const tableRows = filteredLogs.map((log, i) => {
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
                const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                return [
                    `${i + 1}.`,
                    `${dateStr}\n${timeStr}`,
                    `${log.user?.username || "User Terhapus"}\n(${log.user?.role || "Unknown"})`,
                    log.action,
                    log.description
                ];
            });

            autoTable(doc, {
                startY: 40,
                head: [["No.", "Waktu", "Pengguna", "Aksi", "Detail"]],
                body: tableRows,
                theme: "plain",
                styles: { font: "times", fontSize: 9, cellPadding: 2 },
                headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.1 }, lineColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 'auto' }
                },
                margin: { left: 14, right: 14 },
            });

            doc.setProperties({ title: 'Log_Aktivitas.pdf' });
            
            if (action === 'download') {
                doc.save(`Log_Aktivitas_${new Date().getTime()}.pdf`);
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PDF berhasil diunduh.', timer: 2000, showConfirmButton: false });
            } else {
                const pdfBlob = doc.output('bloburl');
                window.open(pdfBlob, '_blank');
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Preview PDF berhasil dibuka di tab baru.', timer: 2000, showConfirmButton: false });
            }
        } catch (error) {
            console.error("Gagal Download PDF:", error);
            Swal.fire('Error', 'Terjadi kesalahan teknis saat menyusun data PDF.', 'error');
        }
    };

    const filteredLogs = logs.filter(
        (log) =>
            (log.user?.username || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (log.action || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (log.description || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const getActionColor = (action) => {
        switch (action) {
            case "LOGIN":
                return "text-emerald-600 bg-emerald-50";
            case "LOGOUT":
                return "text-slate-600 bg-slate-50";
            case "CREATE":
                return "text-blue-600 bg-blue-50";
            case "UPDATE":
                return "text-amber-600 bg-amber-50";
            case "DELETE":
                return "text-red-600 bg-red-50";
            default:
                return "text-slate-600 bg-slate-50";
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full text-slate-700 relative mb-6">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        Activity Log
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        {searchTerm
                            ? `Ditemukan ${filteredLogs.length} aktivitas`
                            : `Total ${logs.length} aktivitas sistem`}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
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
                    
                    <div className="inline-flex shadow-sm rounded-xl overflow-hidden border border-rose-200 shrink-0">
                        <button 
                            onClick={() => handleExportPDF('preview')} 
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold transition-colors flex items-center gap-2 uppercase tracking-wide whitespace-nowrap shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            PREVIEW
                        </button>
                        <button 
                            onClick={() => handleExportPDF('download')} 
                            className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors flex items-center gap-2 uppercase tracking-wide whitespace-nowrap shrink-0"
                        >
                            UNDUH PDF
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <g
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeWidth="2.5"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                            </g>
                        </svg>
                        <input
                            type="search"
                            placeholder="Cari aktivitas..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full bg-slate-50 text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto border-t border-slate-100 max-h-[600px]">
                <table className="w-full text-left border-collapse min-w-[820px] table-auto">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-4 border-b border-slate-100">
                                Date
                            </th>
                            <th className="px-4 py-4 border-b border-slate-100">
                                Time
                            </th>
                            <th className="px-4 py-4 border-b border-slate-100">
                                User
                            </th>
                            <th className="px-4 py-4 border-b border-slate-100">
                                Action
                            </th>
                            <th className="px-4 py-4 border-b border-slate-100">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="py-10 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-50 cursor-default text-slate-500 transition-colors"
                                >
                                    <td className="px-4 py-4 align-top font-medium text-slate-700 whitespace-nowrap">
                                        {new Date(
                                            log.created_at,
                                        ).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-4 py-4 align-top whitespace-nowrap">
                                        {new Date(
                                            log.created_at,
                                        ).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {log.user?.username ||
                                                    "User Terhapus"}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {log.user?.role || "Unknown"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-600">
                                        {log.description}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="py-10 text-center text-slate-400"
                                >
                                    Tidak ada data aktivitas ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                    Showing {filteredLogs.length} activity
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSearchTerm("")}
                        className="text-sm text-slate-500 hover:text-sky-600 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

import React from "react";

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 25, 50, 100],
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(totalItems, currentPage * itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i += 1) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i += 1) pages.push(i);

            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="px-4 py-4 border-t border-slate-200 bg-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center text-sm text-slate-500">
                    <span>Tampilkan</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    >
                        {itemsPerPageOptions.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                    <span>per halaman</span>
                </div>

                <div className="flex flex-col gap-1 text-sm text-slate-500 text-left sm:text-right">
                    <span>
                        Menampilkan {startItem}–{endItem} dari {totalItems}
                    </span>
                    <span>Halaman {currentPage} dari {totalPages}</span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    ← Sebelumnya
                </button>

                {getPageNumbers().map((page, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => typeof page === "number" && onPageChange(page)}
                        disabled={page === "..."}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                            page === currentPage
                                ? "bg-sky-600 text-white border border-sky-600"
                                : page === "..."
                                    ? "cursor-default text-slate-400"
                                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Selanjutnya →
                </button>
            </div>
        </div>
    );
}

import EmployeeForm from "../components/EmployeeForm";
import React from "react";

export default function TambahPegawai() {
    const handleSave = (data) => {
        // placeholder: connect to API or parent state
        console.log("Tambah pegawai:", data);
        alert("Pegawai disimpan (demo): " + (data.name || "—"));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                <h3 className="text-lg text-slate-700 font-semibold mb-4">Tambah Pegawai</h3>
                <EmployeeForm onSave={handleSave} />
            </div>
        </div>
    );
}

import { useState } from "react";
import React from "react";

export default function EmployeeForm({ initial = {}, onSave, onCancel }) {
    const [form, setForm] = useState({
        nip: initial.nip || "",
        name: initial.name || "",
        unit: initial.unit || "",
        position: initial.position || "",
        phone: initial.phone || "",
        alamat: initial.alamat || "",
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave && onSave(form);
            }}
            className="grid gap-3"
        >
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Nama <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            placeholder="Nama lengkap"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="nip"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            NIP <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nip"
                            name="nip"
                            placeholder="Nomor Induk Pegawai"
                            value={form.nip}
                            onChange={(e) =>
                                setForm({ ...form, nip: e.target.value })
                            }
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="unit"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Unit
                        </label>
                        <input
                            id="unit"
                            name="unit"
                            placeholder="Unit kerja"
                            value={form.unit}
                            onChange={(e) =>
                                setForm({ ...form, unit: e.target.value })
                            }
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="position"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Jabatan
                        </label>
                        <input
                            id="position"
                            name="position"
                            placeholder="Jabatan"
                            value={form.position}
                            onChange={(e) =>
                                setForm({ ...form, position: e.target.value })
                            }
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Phone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            placeholder="+62 812 3456 7890"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="alamat"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Alamat
                        </label>
                        <textarea
                            id="alamat"
                            name="alamat"
                            placeholder="Alamat lengkap"
                            value={form.alamat}
                            onChange={(e) =>
                                setForm({ ...form, alamat: e.target.value })
                            }
                            rows={3}
                            className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900
                           placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() =>
                            setForm({
                                name: "",
                                nip: "",
                                unit: "",
                                position: "",
                                phone: "",
                                alamat: "",
                            })
                        }
                        className="rounded-md border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-700
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-100"
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                    >
                        Submit
                    </button>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3"></div>

            <div className="flex gap-2 justify-end mt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1 border rounded"
                    >
                        Batal
                    </button>
                )}
            </div>
        </form>
    );
}

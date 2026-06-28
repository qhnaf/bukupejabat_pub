import React from "react";
import Modal from "./Modal";

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    message = "Are you sure?",
}) {
    if (!open) return null;

    return (
        <Modal className="text-slate-700" open={open} onClose={onClose} title="Konfirmasi">
            <p className="mb-4 text-sm text-slate-700">{message}</p>
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn btn-neutral btn-outline">Batal</button>
                <button onClick={() => { onConfirm && onConfirm(); onClose && onClose(); }} className="btn btn-error"> Hapus </button>
            </div>
        </Modal>
    );
}

<?php

namespace App\Http\Controllers;

use App\Models\KonsulKehormatan;
use Illuminate\Http\Request;

class KonsulKehormatanController extends Controller
{
    public function index()
    {
        // Tampilkan semua data konsul kehormatan dari semua satker.
        // Kontrol aksi edit/hapus dilakukan di sisi frontend berdasarkan unit_kerja_id.
        $query = KonsulKehormatan::orderBy('id', 'desc');

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'negara' => 'required|string',
            'kota' => 'required|string',
            'alamat' => 'required|string',
            'no_telp' => 'nullable|string',
            'fax' => 'nullable|string',
            'email' => 'nullable|string',
            'website' => 'nullable|string',
            'hari_kerja' => 'nullable|string',
            'unit_kerja_id' => 'nullable|exists:unit_kerja,id'
        ]);

        // Jika bukan superadmin, paksa unit_kerja_id sesuai user
        if ($user && $user->role !== 'superadmin') {
            $validated['unit_kerja_id'] = $user->unit_kerja_id;
        }

        $konsul = KonsulKehormatan::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil ditambahkan',
            'data' => $konsul
        ]);
    }

    public function show($id)
    {
        $konsul = KonsulKehormatan::find($id);
        if (!$konsul) return response()->json(['success' => false, 'message' => 'Not found'], 404);
        
        return response()->json(['success' => true, 'data' => $konsul]);
    }

    public function update(Request $request, $id)
    {
        $konsul = KonsulKehormatan::find($id);
        if (!$konsul) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        $validated = $request->validate([
            'negara' => 'required|string',
            'kota' => 'required|string',
            'alamat' => 'required|string',
            'no_telp' => 'nullable|string',
            'fax' => 'nullable|string',
            'email' => 'nullable|string',
            'website' => 'nullable|string',
            'hari_kerja' => 'nullable|string',
        ]);

        $konsul->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diupdate',
            'data' => $konsul
        ]);
    }

    public function destroy($id)
    {
        $konsul = KonsulKehormatan::find($id);
        if (!$konsul) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        $konsul->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }
}

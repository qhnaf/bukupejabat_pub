<?php

namespace App\Http\Controllers;

use App\Models\PejabatKonsul;
use Illuminate\Http\Request;

class PejabatKonsulController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = PejabatKonsul::query();

        // Filter berdasarkan unit kerja user jika bukan superadmin
        if ($user && $user->role !== 'superadmin' && $user->unit_kerja_id) {
            $query->whereHas('konsul', function($q) use ($user) {
                $q->where('unit_kerja_id', $user->unit_kerja_id);
            });
        }

        if ($request->has('konsul_id')) {
            $query->where('konsul_id', $request->konsul_id);
        }
        
        $data = $query->get()->map(function($item) {
            $item->telp = $item->no_telp; // Map DB field back to frontend format
            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'konsul_id' => 'required|exists:konsul_kehormatans,id',
            'nama' => 'required|string',
            'gelar_jabatan' => 'nullable|string',
            'alamat' => 'nullable|string',
        ]);

        // Support frontend passing 'telp' instead of 'no_telp'
        $validated['no_telp'] = $request->input('telp', null) ?? $request->input('no_telp', null);

        $pejabat = PejabatKonsul::create($validated);
        $pejabat->telp = $pejabat->no_telp;

        return response()->json([
            'success' => true,
            'message' => 'Pejabat berhasil ditambahkan',
            'data' => $pejabat
        ]);
    }

    public function update(Request $request, $id)
    {
        $pejabat = PejabatKonsul::find($id);
        if (!$pejabat) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        $validated = $request->validate([
            'konsul_id' => 'sometimes|exists:konsul_kehormatans,id',
            'nama' => 'required|string',
            'gelar_jabatan' => 'nullable|string',
            'alamat' => 'nullable|string',
        ]);

        if ($request->has('telp') || $request->has('no_telp')) {
            $validated['no_telp'] = $request->input('telp', null) ?? $request->input('no_telp', null);
        }

        $pejabat->update($validated);
        $pejabat->telp = $pejabat->no_telp;

        return response()->json([
            'success' => true,
            'message' => 'Pejabat berhasil diupdate',
            'data' => $pejabat
        ]);
    }

    public function destroy($id)
    {
        $pejabat = PejabatKonsul::find($id);
        if (!$pejabat) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        $pejabat->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pejabat berhasil dihapus'
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UnitKerja;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class UnitKerjaController extends Controller
{
    // ==========================================
    // FUNGSI 1: MENGAMBIL DATA (Kodingan Anda)
    // ==========================================
    public function index(Request $request)
    {
        // Ambil data Unit Kerja + Hitung Jumlah Pegawai otomatis
        $query = UnitKerja::withCount('pegawai');

        // Fitur Pencarian (jika nanti butuh search)
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nama_unit_kerja', 'like', "%{$search}%")
                ->orWhere('kode_unit_kerja', 'like', "%{$search}%");
        }

        $units = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar Unit Kerja berhasil diambil',
            'data' => $units
        ]);
    }

    // ==========================================
    // FUNGSI 2: IMPORT CSV (Fungsi Baru)
    // ==========================================
    public function importMasterData()
    {
        // --- A. IMPORT UNIT KERJA ---
        $pathUnit = storage_path('app/unit_kerja.csv');
        $countUnit = 0;

        if (File::exists($pathUnit)) {
            $lines = file($pathUnit, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            foreach ($lines as $index => $line) {
                if ($index === 0)
                    continue;

                $row = str_getcsv($line, ';');
                if (count($row) < 2) {
                    $row = str_getcsv($line, ',');
                }

                $kode = trim($row[0] ?? '');
                $nama = trim($row[1] ?? 'Tanpa Nama');
                $keterangan = trim($row[2] ?? '');

                if ($kode === '')
                    continue;

                UnitKerja::updateOrCreate(
                    ['kode_unit_kerja' => $kode],
                    [
                        'nama_unit_kerja' => $nama,
                        'deskripsi' => $keterangan
                    ]
                );
                $countUnit++;
            }
        } else {
            return response()->json(['message' => 'File unit_kerja.csv tidak ditemukan di storage/app/'], 404);
        }

        // --- B. IMPORT JABATAN ---
        $pathJabatan = storage_path('app/jabatan.csv');
        $countJabatan = 0;

        if (File::exists($pathJabatan)) {
            $lines = file($pathJabatan, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            foreach ($lines as $index => $line) {
                if ($index === 0)
                    continue;

                $row = str_getcsv($line, ';');
                if (count($row) < 2) {
                    $row = str_getcsv($line, ',');
                }

                $kode = trim($row[0] ?? '');
                $nama = trim($row[1] ?? 'Tanpa Nama');

                if ($kode === '')
                    continue;

                Jabatan::updateOrCreate(
                    ['kode_jabatan' => $kode],
                    ['nama_jabatan' => $nama]
                );
                $countJabatan++;
            }
        } else {
            return response()->json(['message' => 'File jabatan.csv tidak ditemukan di storage/app/'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Selesai! Berhasil memasukkan $countUnit Unit Kerja dan $countJabatan Jabatan."
        ]);
    }

    // ==========================================
    // FUNGSI 3: UPDATE DATA DARI MODAL REACT
    // ==========================================
    public function update(Request $request, $id)
    {
        // 1. Cari data unit kerja berdasarkan ID
        $unitKerja = UnitKerja::find($id);

        if (!$unitKerja) {
            return response()->json([
                'success' => false,
                'message' => 'Data Unit Kerja tidak ditemukan'
            ], 404);
        }

        // 2. Validasi sederhana memastikan kode dan nama tidak kosong
        $request->validate([
            'kode_unit_kerja' => 'required|string|max:255',
            'nama_unit_kerja' => 'required|string|max:255',
        ]);

        // 3. Update data ke database
        $unitKerja->update($request->all());

        // 4. Berikan respon sukses
        return response()->json([
            'success' => true,
            'message' => 'Data Unit Kerja berhasil diperbarui',
            'data' => $unitKerja
        ], 200);
    }

    // Fungsi untuk mengambil Unit Kerja Dalam Negeri (Kode 07A)
    public function getDalamNegeri()
    {
        $user = auth()->user();
        $query = \App\Models\UnitKerja::withCount('pegawai')->where('kode_unit_kerja', 'like', '07%');


        $units = $query->orderBy('nama_unit_kerja', 'asc')->get();

        return response()->json([
            'success' => true, 
            'data' => $units
        ]);
    }

    public function getLuarNegeri()
    {
        $user = auth()->user();
        $query = \App\Models\UnitKerja::withCount('pegawai')->where('kode_unit_kerja', 'like', '04A1%');


        $units = $query->orderBy('nama_unit_kerja', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $units
        ]);
    }
}
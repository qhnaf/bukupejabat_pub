<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\UnitKerja;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $pegawais = Pegawai::with(['unitKerja', 'jabatan'])->get();

        $formatted = $pegawais->map(function ($p) {
            return [
                'id' => $p->id,
                'nip' => $p->nip,
                'nama' => $p->nama,
                'nama_pegawai' => $p->nama,
                'email' => $p->email,
                'no_handphone' => $p->no_handphone,
                'jabatan' => $p->jabatan ? $p->jabatan->nama_jabatan : '-',
                'eselon' => $p->jabatan ? $p->jabatan->eselon : null,
                'unit_kerja_id' => $p->unit_kerja_id,
                'nama_unit_kerja' => $p->unitKerja ? $p->unitKerja->nama_unit_kerja : '-',
                'bobot' => $p->bobot,
                'wisma' => $p->wisma,
                'tmt_kedatangan' => $p->tmt_kedatangan,
                'tmt_credential' => $p->tmt_credential
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diambil dari database',
            'data' => $formatted
        ]);
    }

    public function getByUnit($unitId)
    {
        $user = auth()->user();


        $unitKerja = UnitKerja::find($unitId);
        if (!$unitKerja) {
            return response()->json(['success' => false, 'message' => 'Unit tidak ditemukan.'], 404);
        }

        $pegawais = Pegawai::with(['jabatan', 'unitKerja'])
            ->where('unit_kerja_id', $unitId)
            ->get();

        $formatted = $pegawais->map(function ($p) {
            return [
                'id' => $p->id,
                'nip' => $p->nip,
                'nama_pegawai' => $p->nama,
                'email' => $p->email,
                'jabatan' => $p->jabatan ? $p->jabatan->nama_jabatan : '-',
                'kode_jabatan' => $p->jabatan ? $p->jabatan->kode_jabatan : '-',
                'telepon' => $p->no_handphone,
                'alamat' => $p->alamat,
                'nama_unit' => $p->unitKerja ? $p->unitKerja->nama_unit_kerja : '-',
                'bobot' => $p->bobot,
                'wisma' => $p->wisma,
                'tmt_kedatangan' => $p->tmt_kedatangan,
                'tmt_credential' => $p->tmt_credential
            ];
        });

        return response()->json([
            'success' => true,
            'unit_nama' => $unitKerja->nama_unit_kerja,
            'unit_profil' => $unitKerja,
            'data' => $formatted
        ]);
    }

    public function syncFromJsonStrict()
    {
        $path = base_path('resources/js/src/data/response_get_all_employee.json');

        if (!File::exists($path)) {
            return response()->json(['success' => false, 'message' => 'File JSON tidak ditemukan!'], 404);
        }

        try {
            $jsonString = File::get($path);
            $data = json_decode($jsonString, true);

            $pegawais = [];
            if (isset($data['data']['emp'])) {
                $pegawais = $data['data']['emp'];
            } elseif (isset($data['emp'])) {
                $pegawais = $data['emp'];
            } elseif (is_array($data) && isset($data[0]['nama'])) {
                $pegawais = $data;
            }

            if (empty($pegawais)) {
                return response()->json(['success' => false, 'message' => 'Data pegawai tidak ditemukan!']);
            }

            $unitKerjaMap = UnitKerja::pluck('id', 'kode_unit_kerja')->mapWithKeys(function ($id, $kode) {
                return [strtoupper(trim($kode)) => $id];
            })->toArray();

            $jabatanMap = Jabatan::pluck('id', 'nama_jabatan')->mapWithKeys(function ($id, $nama) {
                return [strtolower(trim($nama)) => $id];
            })->toArray();

            $countInserted = 0;
            $countSkipped = 0;

            foreach ($pegawais as $item) {
                $nip = $item['nip'] ?? null;

                if ($nip === null || trim($nip) === '')
                    continue;

                $kodeUnkerJson = strtoupper(trim($item['kd_unker'] ?? ''));
                $namaJabatanJson = strtolower(trim($item['Jabatan'] ?? ''));

                if (!isset($unitKerjaMap[$kodeUnkerJson]) || $kodeUnkerJson === '') {
                    $countSkipped++;
                    continue;
                }

                $jabatanId = $jabatanMap[$namaJabatanJson] ?? null;

                if ($jabatanId === null) {
                    $namaJabatanAsli = trim($item['Jabatan'] ?? 'Tidak Diketahui');
                    $jabatanBaru = Jabatan::firstOrCreate(
                        ['nama_jabatan' => $namaJabatanAsli],
                        ['kode_jabatan' => 'JAB-' . strtoupper(substr(md5($namaJabatanAsli), 0, 5))]
                    );
                    $jabatanId = $jabatanBaru->id;
                    $jabatanMap[$namaJabatanJson] = $jabatanId;
                }

                Pegawai::updateOrCreate(
                    ['nip' => trim($nip)],
                    [
                        'nama' => $item['nama'] ?? 'Tanpa Nama',
                        'alamat' => $item['LokasiKerjaName'] ?? '-',
                        'no_handphone' => $item['no_hp'] ?? '-',
                        'unit_kerja_id' => $unitKerjaMap[$kodeUnkerJson],
                        'jabatan_id' => $jabatanId,
                    ]
                );

                $countInserted++;
            }

            return response()->json([
                'success' => true,
                'message' => "Sync Selesai! Berhasil menyimpan: $countInserted pegawai. Ditolak/Diabaikan: $countSkipped pegawai."
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: ' . $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $pegawai = Pegawai::find($id);

        if (!$pegawai) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $pegawai->nama = $request->nama ?? $pegawai->nama;
        $pegawai->email = $request->email ?? $pegawai->email;
        $pegawai->no_handphone = $request->no_handphone ?? $pegawai->no_handphone;
        $pegawai->alamat = $request->alamat ?? $pegawai->alamat;

        $pegawai->bobot = $request->bobot ?? $pegawai->bobot;
        $pegawai->wisma = $request->wisma ?? $pegawai->wisma;
        $pegawai->tmt_kedatangan = $request->tmt_kedatangan ?? $pegawai->tmt_kedatangan;
        $pegawai->tmt_credential = $request->tmt_credential ?? $pegawai->tmt_credential;

        if ($request->filled('jabatan')) {
            $namaJabatan = trim($request->jabatan);
            $jabatanBaru = Jabatan::firstOrCreate(
                ['nama_jabatan' => $namaJabatan],
                ['kode_jabatan' => 'JAB-' . strtoupper(substr(md5($namaJabatan), 0, 5))]
            );
            $pegawai->jabatan_id = $jabatanBaru->id;
        }

        $pegawai->save();

        return response()->json([
            'success' => true,
            'message' => 'Data Pegawai berhasil diupdate',
            'data' => $pegawai
        ]);
    }

    public function getDashboardStats()
    {
        $totalPegawai = \App\Models\Pegawai::count();
        $totalAdmin = \App\Models\User::count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_pegawai' => $totalPegawai,
                'total_admin' => $totalAdmin
            ]
        ]);
    }

    // =======================================================
    // FUNGSI AUDIT: MENCARI DATA KODE JABATAN YANG JANGGAL
    // =======================================================
    public function cleanseData()
    {
        // JANGAN DIHAPUS. Kita hanya mencari data pegawai yang kodenya BUKAN 04 dan 07.
        // Juga mendeteksi kode acak (seperti JAB-ABCDE)
        $anomaliPegawai = \App\Models\Pegawai::with(['jabatan', 'unitKerja'])
            ->whereHas('jabatan', function ($query) {
                $query->where('kode_jabatan', 'not like', '04%')
                    ->where('kode_jabatan', 'not like', '07%');
            })
            ->get(); // PERHATIKAN: Di sini menggunakan get(), BUKAN delete()

        $hasil = $anomaliPegawai->map(function ($p) {
            return [
                'nama_pegawai' => $p->nama,
                'jabatan_tersimpan' => $p->jabatan ? $p->jabatan->nama_jabatan : '-',
                'kode_jabatan_tersimpan' => $p->jabatan ? $p->jabatan->kode_jabatan : '-',
                'unit_kerja' => $p->unitKerja ? $p->unitKerja->deskripsi : '-',
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Audit Data Selesai. TIDAK ADA data yang dihapus.',
            'total_data_janggal' => $anomaliPegawai->count() . ' pegawai ditemukan menggunakan kode di luar 04 dan 07.',
            'data_perlu_dicek' => $hasil
        ], 200, [], JSON_PRETTY_PRINT);
    }
}
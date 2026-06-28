<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SyncConfig;
use App\Models\SyncLog;
use App\Models\Pegawai;
use App\Models\UnitKerja;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncDataController extends Controller
{
    public function getConfig()
    {
        $config = SyncConfig::first();

        if (!$config) {
            $config = SyncConfig::create([
                'api_url' => null,
                'api_key' => null,
                'http_method' => 'GET',
                'auto_sync_enabled' => false,
                'auto_sync_type' => 'weekly',
                'auto_sync_day' => 'Senin',
                'auto_sync_date' => 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $config
        ]);
    }

    public function saveConfig(Request $request)
    {
        $request->validate([
            'api_url' => 'nullable|string',
            'api_key' => 'nullable|string',
            'http_method' => 'in:GET,POST',
            'auto_sync_enabled' => 'boolean',
            'auto_sync_type' => 'in:weekly,monthly',
            'auto_sync_day' => 'nullable|string',
            'auto_sync_date' => 'nullable|integer|between:1,31',
        ]);

        $config = SyncConfig::first();

        if (!$config) {
            $config = SyncConfig::create($request->only([
                'api_url', 'api_key', 'http_method',
                'auto_sync_enabled', 'auto_sync_type',
                'auto_sync_day', 'auto_sync_date',
            ]));
        } else {
            $config->update($request->only([
                'api_url', 'api_key', 'http_method',
                'auto_sync_enabled', 'auto_sync_type',
                'auto_sync_day', 'auto_sync_date',
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi sinkronisasi berhasil disimpan.',
            'data' => $config
        ]);
    }

    public function testConnection()
    {
        $config = SyncConfig::first();

        if (!$config || !$config->api_url) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada konfigurasi endpoint API. Silakan simpan konfigurasi terlebih dahulu.'
            ], 400);
        }

        $url = $this->buildUrl($config->api_url);

        try {
            $response = $this->makeApiRequest($config, $url, 10);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Koneksi berhasil! Endpoint merespon dengan status ' . $response->status() . '.',
                    'status_code' => $response->status(),
                    'sample_data' => $this->extractEmployees($response->json()) ? 'Data pegawai ditemukan.' : 'Respons diterima, namun format data perlu disesuaikan.'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Koneksi gagal. Server merespon dengan status ' . $response->status() . '.',
                'status_code' => $response->status()
            ], 400);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat terhubung ke endpoint. Periksa URL dan koneksi jaringan.',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menguji koneksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function triggerSync(Request $request)
    {
        $method = $request->input('method', 'Manual');

        $config = SyncConfig::first();

        if (!$config || !$config->api_url) {
            $log = SyncLog::create([
                'date' => now(),
                'method' => $method,
                'status' => 'Failed',
                'detail' => 'Konfigurasi endpoint API belum diatur.',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi endpoint API belum diatur.',
                'log' => $log
            ], 400);
        }

        $url = $this->buildUrl($config->api_url);

        try {
            $response = $this->makeApiRequest($config, $url, 30);

            if (!$response->successful()) {
                $log = SyncLog::create([
                    'date' => now(),
                    'method' => $method,
                    'status' => 'Failed',
                    'detail' => "API merespon dengan status {$response->status()}. Periksa kredensial atau endpoint.",
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "Sinkronisasi gagal. API status: {$response->status()}.",
                    'log' => $log
                ], 400);
            }

            $jsonData = $response->json();
            $pegawais = $this->extractEmployees($jsonData);

            if (empty($pegawais)) {
                $log = SyncLog::create([
                    'date' => now(),
                    'method' => $method,
                    'status' => 'Failed',
                    'detail' => 'Data pegawai tidak ditemukan dalam respons API.',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Data pegawai tidak ditemukan dalam respons API.',
                    'log' => $log
                ], 400);
            }

            $result = $this->processEmployees($pegawais);

            $detail = "Berhasil menyimpan: {$result['inserted']} pegawai. " .
                       "Ditolak/Diabaikan: {$result['skipped']} pegawai.";

            $log = SyncLog::create([
                'date' => now(),
                'method' => $method,
                'status' => 'Success',
                'detail' => $detail,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Sinkronisasi selesai! {$detail}",
                'inserted' => $result['inserted'],
                'skipped' => $result['skipped'],
                'log' => $log
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            $log = SyncLog::create([
                'date' => now(),
                'method' => $method,
                'status' => 'Failed',
                'detail' => 'Gagal terhubung ke endpoint API: ' . $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke endpoint API.',
                'log' => $log
            ], 500);
        } catch (\Exception $e) {
            Log::error('SyncData trigger error: ' . $e->getMessage());

            $log = SyncLog::create([
                'date' => now(),
                'method' => $method,
                'status' => 'Failed',
                'detail' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat sinkronisasi.',
                'log' => $log
            ], 500);
        }
    }

    private function buildUrl(string $endpoint): string
    {
        $endpoint = trim($endpoint);

        if (str_starts_with($endpoint, 'http://') || str_starts_with($endpoint, 'https://')) {
            return $endpoint;
        }

        return 'https://' . $endpoint;
    }

    private function makeApiRequest(SyncConfig $config, string $url, int $timeout = 30)
    {
        $headers = [];

        if ($config->api_key) {
            $headers['Authorization'] = 'Bearer ' . $config->api_key;
        }

        if (strtoupper($config->http_method) === 'POST') {
            return Http::withHeaders($headers)
                ->timeout($timeout)
                ->post($url);
        }

        return Http::withHeaders($headers)
            ->timeout($timeout)
            ->get($url);
    }

    private function extractEmployees(?array $jsonData): ?array
    {
        if (!$jsonData) return null;

        if (isset($jsonData['data']['emp']) && is_array($jsonData['data']['emp'])) {
            return $jsonData['data']['emp'];
        }

        if (isset($jsonData['emp']) && is_array($jsonData['emp'])) {
            return $jsonData['emp'];
        }

        if (isset($jsonData['data']) && is_array($jsonData['data']) && isset($jsonData['data'][0]['nama'])) {
            return $jsonData['data'];
        }

        if (is_array($jsonData) && isset($jsonData[0]['nama'])) {
            return $jsonData;
        }

        return null;
    }

    public function processEmployees(array $pegawais): array
    {
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

            if ($nip === null || trim($nip) === '') {
                $countSkipped++;
                continue;
            }

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

        return [
            'inserted' => $countInserted,
            'skipped' => $countSkipped,
        ];
    }
}

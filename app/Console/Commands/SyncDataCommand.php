<?php

namespace App\Console\Commands;

use App\Models\SyncConfig;
use App\Models\SyncLog;
use App\Models\Pegawai;
use App\Models\UnitKerja;
use App\Models\Jabatan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncDataCommand extends Command
{
    protected $signature = 'sync:data';
    protected $description = 'Jalankan sinkronisasi data pegawai dari API eksternal (auto sync)';

    public function handle(): int
    {
        $config = SyncConfig::first();

        if (!$config || !$config->auto_sync_enabled || !$config->api_url) {
            $this->info('Auto sync belum diaktifkan atau endpoint belum dikonfigurasi.');
            return self::SUCCESS;
        }

        if (!$this->shouldRun($config)) {
            $this->info('Bukan jadwal sync. Skip.');
            return self::SUCCESS;
        }

        $this->info('Memulai auto sync dari: ' . $config->api_url);

        try {
            $url = $this->buildUrl($config->api_url);
            $response = $this->makeApiRequest($config, $url);

            if (!$response->successful()) {
                SyncLog::create([
                    'date' => now(),
                    'method' => 'Auto',
                    'status' => 'Failed',
                    'detail' => "Auto sync gagal. API status: {$response->status()}.",
                ]);

                $this->error("API merespon dengan status {$response->status()}");
                return self::FAILURE;
            }

            $jsonData = $response->json();
            $pegawais = $this->extractEmployees($jsonData);

            if (empty($pegawais)) {
                SyncLog::create([
                    'date' => now(),
                    'method' => 'Auto',
                    'status' => 'Failed',
                    'detail' => 'Auto sync gagal. Data pegawai tidak ditemukan dalam respons API.',
                ]);

                $this->error('Data pegawai tidak ditemukan dalam respons API.');
                return self::FAILURE;
            }

            $result = $this->processEmployees($pegawais);

            $detail = "Auto sync selesai. Berhasil: {$result['inserted']}. Ditolak: {$result['skipped']}.";

            SyncLog::create([
                'date' => now(),
                'method' => 'Auto',
                'status' => 'Success',
                'detail' => $detail,
            ]);

            $this->info($detail);
            return self::SUCCESS;

        } catch (\Exception $e) {
            Log::error('SyncDataCommand error: ' . $e->getMessage());

            SyncLog::create([
                'date' => now(),
                'method' => 'Auto',
                'status' => 'Failed',
                'detail' => 'Auto sync error: ' . $e->getMessage(),
            ]);

            $this->error('Gagal melakukan auto sync: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function shouldRun(SyncConfig $config): bool
    {
        $now = now();
        $dayName = match($now->dayOfWeek) {
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        };

        if ($config->auto_sync_type === 'weekly') {
            return $dayName === $config->auto_sync_day;
        }

        if ($config->auto_sync_type === 'monthly') {
            return (int) $now->day === (int) $config->auto_sync_date;
        }

        return false;
    }

    private function buildUrl(string $endpoint): string
    {
        $endpoint = trim($endpoint);
        if (str_starts_with($endpoint, 'http://') || str_starts_with($endpoint, 'https://')) {
            return $endpoint;
        }
        return 'https://' . $endpoint;
    }

    private function makeApiRequest(SyncConfig $config, string $url)
    {
        $headers = [];
        if ($config->api_key) {
            $headers['Authorization'] = 'Bearer ' . $config->api_key;
        }

        if (strtoupper($config->http_method) === 'POST') {
            return Http::withHeaders($headers)->timeout(60)->post($url);
        }

        return Http::withHeaders($headers)->timeout(60)->get($url);
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

    private function processEmployees(array $pegawais): array
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
            if ($nip === null || trim($nip) === '') { $countSkipped++; continue; }

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

        return ['inserted' => $countInserted, 'skipped' => $countSkipped];
    }
}

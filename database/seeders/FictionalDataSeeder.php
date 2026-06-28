<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\UnitKerja;
use App\Models\Jabatan;
use App\Models\Pegawai;
use App\Models\KonsulKehormatan;
use App\Models\PejabatKonsul;
use App\Models\SyncConfig;
use App\Models\SyncLog;
use App\Models\ActivityLog;

class FictionalDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Matikan pengecekan Foreign Key & Kosongkan Tabel (Agar bersih dari data sensitif)
        Schema::disableForeignKeyConstraints();
        Pegawai::truncate();
        Jabatan::truncate();
        UnitKerja::truncate();
        KonsulKehormatan::truncate();
        PejabatKonsul::truncate();
        SyncLog::truncate();
        SyncConfig::truncate();
        ActivityLog::truncate();
        Schema::enableForeignKeyConstraints();

        // 2. Seed Unit Kerja (Dalam Negeri: Kode mulai "07", Luar Negeri: Kode mulai "04A1")
        $unkerDalamNegeri = [
            [
                'kode_unit_kerja' => '07A0B001C000',
                'nama_unit_kerja' => 'Menteri Luar Negeri RI',
                'alamat' => 'Jl. Taman Pejambon No. 6, Jakarta Pusat 10110',
                'telepon' => '021-3848626',
                'fax' => '021-3850893',
                'email' => 'menlu@kemlu.go.id',
                'website' => 'www.kemlu.go.id',
                'hari_kerja' => 'Senin - Jumat, 08:00 - 16:30 WIB',
                'beda_jam' => 'WIB',
                'deskripsi' => 'Kantor Biro Menteri Luar Negeri Republik Indonesia'
            ],
            [
                'kode_unit_kerja' => '07A1B001C000',
                'nama_unit_kerja' => 'Sekretariat Jenderal',
                'alamat' => 'Jl. Taman Pejambon No. 6, Jakarta Pusat 10110',
                'telepon' => '021-3811090',
                'fax' => '021-3844867',
                'email' => 'setjen@kemlu.go.id',
                'website' => 'setjen.kemlu.go.id',
                'hari_kerja' => 'Senin - Jumat, 08:00 - 16:30 WIB',
                'beda_jam' => 'WIB',
                'deskripsi' => 'Membantu tugas administratif Kementerian Luar Negeri'
            ],
            [
                'kode_unit_kerja' => '07A1B002C000',
                'nama_unit_kerja' => 'Biro Sumber Daya Manusia',
                'alamat' => 'Jl. Taman Pejambon No. 6, Gedung Utama Kemlu, Jakarta',
                'telepon' => '021-3849618',
                'fax' => '021-3524154',
                'email' => 'birosdm@kemlu.go.id',
                'website' => 'sdm.kemlu.go.id',
                'hari_kerja' => 'Senin - Jumat, 08:00 - 16:30 WIB',
                'beda_jam' => 'WIB',
                'deskripsi' => 'Biro Kepegawaian dan Sumber Daya Manusia Kementerian Luar Negeri'
            ],
            [
                'kode_unit_kerja' => '07A1B004C000',
                'nama_unit_kerja' => 'Biro Keuangan',
                'alamat' => 'Jl. Taman Pejambon No. 6, Gedung Utama Kemlu, Jakarta',
                'telepon' => '021-3842131',
                'fax' => '021-3842132',
                'email' => 'keuangan@kemlu.go.id',
                'website' => 'keuangan.kemlu.go.id',
                'hari_kerja' => 'Senin - Jumat, 08:00 - 16:30 WIB',
                'beda_jam' => 'WIB',
                'deskripsi' => 'Biro Keuangan dan Anggaran Kementerian Luar Negeri'
            ],
        ];

        $unkerLuarNegeri = [
            [
                'kode_unit_kerja' => '04A1B001C000',
                'nama_unit_kerja' => 'KEDUTAAN BESAR RI TOKYO',
                'alamat' => '2-15-22 Higashi-Gotanda, Shinagawa-ku, Tokyo 141-0022, Japan',
                'telepon' => '+81-3-3441-4201',
                'fax' => '+81-3-3447-1697',
                'email' => 'tokyo.kbri@kemlu.go.id',
                'website' => 'www.kemlu.go.id/tokyo',
                'hari_kerja' => 'Senin - Jumat, 09:00 - 17:00 (Waktu Setempat)',
                'beda_jam' => '+2 jam dari WIB',
                'musim_panas' => 'Juni - Agustus',
                'musim_dingin' => 'Desember - Februari',
                'deskripsi' => 'Perwakilan Diplomatik Republik Indonesia di Tokyo, Jepang'
            ],
            [
                'kode_unit_kerja' => '04A1B002C000',
                'nama_unit_kerja' => 'KEDUTAAN BESAR RI WASHINGTON DC',
                'alamat' => '2020 Massachusetts Ave NW, Washington, DC 20036, United States',
                'telepon' => '+1-202-775-5200',
                'fax' => '+1-202-775-5365',
                'email' => 'washington.kbri@kemlu.go.id',
                'website' => 'www.kemlu.go.id/washington',
                'hari_kerja' => 'Senin - Jumat, 09:00 - 17:00 (Waktu Setempat)',
                'beda_jam' => '-12 jam dari WIB (Waktu Musim Dingin)',
                'musim_panas' => 'Maret - November (EDT)',
                'musim_dingin' => 'November - Maret (EST)',
                'deskripsi' => 'Perwakilan Diplomatik Republik Indonesia di Washington D.C., Amerika Serikat'
            ],
            [
                'kode_unit_kerja' => '04A1B003C000',
                'nama_unit_kerja' => 'KEDUTAAN BESAR RI LONDON',
                'alamat' => '30 Great Peter St, Westminster, London SW1P 2BU, United Kingdom',
                'telepon' => '+44-20-7499-7661',
                'fax' => '+44-20-7491-4993',
                'email' => 'london.kbri@kemlu.go.id',
                'website' => 'www.kemlu.go.id/london',
                'hari_kerja' => 'Senin - Jumat, 09:00 - 17:00 (Waktu Setempat)',
                'beda_jam' => '-6 jam dari WIB (Waktu Musim Dingin)',
                'musim_panas' => 'Maret - Oktober (BST)',
                'musim_dingin' => 'Oktober - Maret (GMT)',
                'deskripsi' => 'Perwakilan Diplomatik Republik Indonesia di London, Inggris Raya'
            ],
            [
                'kode_unit_kerja' => '04A1B004C000',
                'nama_unit_kerja' => 'KONSULAT JENDERAL RI SYDNEY',
                'alamat' => '236-238 Maroubra Rd, Maroubra NSW 2035, Australia',
                'telepon' => '+61-2-9344-9933',
                'fax' => '+61-2-9349-6854',
                'email' => 'sydney.kjri@kemlu.go.id',
                'website' => 'www.kemlu.go.id/sydney',
                'hari_kerja' => 'Senin - Jumat, 09:00 - 17:00 (Waktu Setempat)',
                'beda_jam' => '+3 jam dari WIB',
                'musim_panas' => 'Desember - Februari',
                'musim_dingin' => 'Juni - Agustus',
                'deskripsi' => 'Konsulat Jenderal Republik Indonesia di Sydney, New South Wales, Australia'
            ],
            [
                'kode_unit_kerja' => '04A1B005C000',
                'nama_unit_kerja' => 'PERUTUSAN TETAP RI UNTUK PBB DI NEW YORK',
                'alamat' => '325 East 38th Street, New York, NY 10016, United States',
                'telepon' => '+1-212-972-8333',
                'fax' => '+1-212-972-9780',
                'email' => 'newyork.ptri@kemlu.go.id',
                'website' => 'www.kemlu.go.id/ptri-newyork',
                'hari_kerja' => 'Senin - Jumat, 09:00 - 17:30 (Waktu Setempat)',
                'beda_jam' => '-12 jam dari WIB',
                'musim_panas' => 'Maret - November (EDT)',
                'musim_dingin' => 'November - Maret (EST)',
                'deskripsi' => 'Perutusan Tetap Republik Indonesia untuk Perserikatan Bangsa-Bangsa di New York'
            ]
        ];

        $unitKerjaMap = [];
        foreach (array_merge($unkerDalamNegeri, $unkerLuarNegeri) as $unker) {
            $created = UnitKerja::create($unker);
            $unitKerjaMap[$created->kode_unit_kerja] = $created->id;
        }

        // 3. Seed Jabatan (Kode mulai "07" untuk Dalam Negeri, "04" untuk Luar Negeri)
        $jabatans = [
            ['kode_jabatan' => '07001', 'nama_jabatan' => 'MENTERI LUAR NEGERI'],
            ['kode_jabatan' => '07002', 'nama_jabatan' => 'SEKRETARIS JENDERAL'],
            ['kode_jabatan' => '07003', 'nama_jabatan' => 'KEPALA BIRO SUMBER DAYA MANUSIA'],
            ['kode_jabatan' => '07004', 'nama_jabatan' => 'KEPALA BIRO KEUANGAN'],
            ['kode_jabatan' => '07005', 'nama_jabatan' => 'PEJABAT FUNGSIONAL DIPLOMAT MADYA'],
            ['kode_jabatan' => '07006', 'nama_jabatan' => 'ANALIS KEPEGAWAIAN'],
            ['kode_jabatan' => '07007', 'nama_jabatan' => 'BENDAHARA PENGELUARAN'],

            ['kode_jabatan' => '04001', 'nama_jabatan' => 'DUTA BESAR LUAR BIASA DAN BERKUASA PENUH'],
            ['kode_jabatan' => '04002', 'nama_jabatan' => 'DEPUTY CHIEF OF MISSION (DCM)'],
            ['kode_jabatan' => '04003', 'nama_jabatan' => 'KONSUL JENDERAL'],
            ['kode_jabatan' => '04004', 'nama_jabatan' => 'ATASE PERTAHANAN'],
            ['kode_jabatan' => '04005', 'nama_jabatan' => 'ATASE PENDIDIKAN DAN KEBUDAYAAN'],
            ['kode_jabatan' => '04006', 'nama_jabatan' => 'SEKRETARIS PERTAMA'],
            ['kode_jabatan' => '04007', 'nama_jabatan' => 'SEKRETARIS KEDUA'],
            ['kode_jabatan' => '04008', 'nama_jabatan' => 'STAF TEKNIS KONSULER'],
        ];

        $jabatanMap = [];
        foreach ($jabatans as $jab) {
            $created = Jabatan::create($jab);
            // Simpan mapping case-insensitive nama_jabatan -> id
            $jabatanMap[strtolower(trim($created->nama_jabatan))] = $created->id;
        }

        // 4. Seed Pegawai (Fiktif, menggunakan NIP fiktif yang terstruktur)
        $pegawais = [
            // Menteri & Setjen
            [
                'nip' => '196803201993021001',
                'nama' => 'Prof. Dr. Irwan H. Prasetyo, M.A.',
                'alamat' => 'Kebayoran Baru, Jakarta Selatan',
                'no_handphone' => '08119876543',
                'bobot' => '1',
                'wisma' => null,
                'tmt_kedatangan' => '1993-02-01',
                'tmt_credential' => null,
                'kode_jabatan' => '07001',
                'kode_unit' => '07A0B001C000',
            ],
            [
                'nip' => '197011051996031002',
                'nama' => 'Dr. H. Ahmad Fauzan, M.Si.',
                'alamat' => 'Bintaro, Tangerang Selatan',
                'no_handphone' => '08123456789',
                'bobot' => '2',
                'wisma' => null,
                'tmt_kedatangan' => '1996-03-15',
                'tmt_credential' => null,
                'kode_jabatan' => '07002',
                'kode_unit' => '07A1B001C000',
            ],
            // Biro SDM
            [
                'nip' => '197805122002121003',
                'nama' => 'Budi Santoso, S.H., LL.M.',
                'alamat' => 'Tebet, Jakarta Selatan',
                'no_handphone' => '081399887766',
                'bobot' => '3',
                'wisma' => null,
                'tmt_kedatangan' => '2002-12-01',
                'tmt_credential' => null,
                'kode_jabatan' => '07003',
                'kode_unit' => '07A1B002C000',
            ],
            [
                'nip' => '199208242015032001',
                'nama' => 'Siti Aminah, S.Sos.',
                'alamat' => 'Rawamangun, Jakarta Timur',
                'no_handphone' => '085712345678',
                'bobot' => '4',
                'wisma' => null,
                'tmt_kedatangan' => '2015-03-01',
                'tmt_credential' => null,
                'kode_jabatan' => '07006',
                'kode_unit' => '07A1B002C000',
            ],
            // KBRI Tokyo
            [
                'nip' => '197104081997031001',
                'nama' => 'Drs. Hermawan Kartajaya, M.B.A.',
                'alamat' => 'Shinagawa-ku, Tokyo',
                'no_handphone' => '+81-90-1234-5678',
                'bobot' => '1',
                'wisma' => 'Wisma Duta Besar RI Tokyo',
                'tmt_kedatangan' => '2023-09-10',
                'tmt_credential' => '2023-10-05',
                'kode_jabatan' => '04001',
                'kode_unit' => '04A1B001C000',
            ],
            [
                'nip' => '198212152006042002',
                'nama' => 'Rina Amalia, M.A.',
                'alamat' => 'Meguro-ku, Tokyo',
                'no_handphone' => '+81-80-8765-4321',
                'bobot' => '3',
                'wisma' => 'Wisma Staf Diplomatik Tokyo',
                'tmt_kedatangan' => '2024-02-15',
                'tmt_credential' => null,
                'kode_jabatan' => '04006',
                'kode_unit' => '04A1B001C000',
            ],
            // KBRI Washington DC
            [
                'nip' => '197308091998031002',
                'nama' => 'Kolonel (AU) Edwardus Wisoko, S.IP.',
                'alamat' => 'Bethesda, Maryland, USA',
                'no_handphone' => '+1-202-555-0143',
                'bobot' => '2',
                'wisma' => 'Wisma Athan RI Washington',
                'tmt_kedatangan' => '2024-08-01',
                'tmt_credential' => '2024-08-20',
                'kode_jabatan' => '04004',
                'kode_unit' => '04A1B002C000',
            ],
            [
                'nip' => '198501142010122004',
                'nama' => 'Dwi Lestari, Ph.D.',
                'alamat' => 'Arlington, Virginia, USA',
                'no_handphone' => '+1-703-555-0188',
                'bobot' => '3',
                'wisma' => 'Wisma Indonesia Washington D.C.',
                'tmt_kedatangan' => '2023-01-15',
                'tmt_credential' => null,
                'kode_jabatan' => '04002',
                'kode_unit' => '04A1B002C000',
            ],
            // KJRI Sydney
            [
                'nip' => '197506152000031003',
                'nama' => 'Ahmad Hidayat, M.Si.',
                'alamat' => 'Maroubra, Sydney, Australia',
                'no_handphone' => '+61-412-345-678',
                'bobot' => '1',
                'wisma' => 'Wisma Konsul Jenderal RI Sydney',
                'tmt_kedatangan' => '2022-12-10',
                'tmt_credential' => '2023-01-10',
                'kode_jabatan' => '04003',
                'kode_unit' => '04A1B004C000',
            ],
            [
                'nip' => '199001152014022003',
                'nama' => 'Dewi Lestari, S.Sos.',
                'alamat' => 'Randwick, Sydney, Australia',
                'no_handphone' => '+61-498-765-432',
                'bobot' => '4',
                'wisma' => 'Wisma Staf KJRI Sydney',
                'tmt_kedatangan' => '2024-03-01',
                'tmt_credential' => null,
                'kode_jabatan' => '04007',
                'kode_unit' => '04A1B004C000',
            ]
        ];

        foreach ($pegawais as $p) {
            $jabId = $jabatanMap[strtolower(trim(DB::table('jabatan')->where('kode_jabatan', $p['kode_jabatan'])->value('nama_jabatan')))] ?? null;
            $unitId = $unitKerjaMap[$p['kode_unit']] ?? null;

            if ($jabId && $unitId) {
                Pegawai::create([
                    'nip' => $p['nip'],
                    'nama' => $p['nama'],
                    'alamat' => $p['alamat'],
                    'no_handphone' => $p['no_handphone'],
                    'bobot' => $p['bobot'],
                    'wisma' => $p['wisma'],
                    'tmt_kedatangan' => $p['tmt_kedatangan'],
                    'tmt_credential' => $p['tmt_credential'],
                    'jabatan_id' => $jabId,
                    'unit_kerja_id' => $unitId,
                ]);
            }
        }

        // 5. Seed Konsul Kehormatan
        $konhorList = [
            [
                'kode_unit' => '04A1B003C000', // Di bawah KBRI London
                'negara' => 'Irlandia',
                'kota' => 'Dublin',
                'alamat' => '12 Merrion Square, Dublin 2, Ireland',
                'no_telp' => '+353-1-661-5555',
                'fax' => '+353-1-661-5556',
                'email' => 'dublin.honconsul@kemlu.go.id',
                'website' => 'www.indonesia-dublin.org',
                'hari_kerja' => 'Senin - Kamis, 10:00 - 15:00'
            ],
            [
                'kode_unit' => '04A1B002C000', // Di bawah KBRI Washington DC
                'negara' => 'Amerika Serikat',
                'kota' => 'Miami',
                'alamat' => '800 Brickell Avenue, Penthouse B, Miami, FL 33131, USA',
                'no_telp' => '+1-305-358-0022',
                'fax' => '+1-305-358-0023',
                'email' => 'miami.honconsul@kemlu.go.id',
                'website' => 'www.indonesia-miami.org',
                'hari_kerja' => 'Senin - Jumat, 09:30 - 16:30'
            ]
        ];

        foreach ($konhorList as $kh) {
            $unitId = $unitKerjaMap[$kh['kode_unit']] ?? null;

            $createdKh = KonsulKehormatan::create([
                'unit_kerja_id' => $unitId,
                'negara' => $kh['negara'],
                'kota' => $kh['kota'],
                'alamat' => $kh['alamat'],
                'no_telp' => $kh['no_telp'],
                'fax' => $kh['fax'],
                'email' => $kh['email'],
                'website' => $kh['website'],
                'hari_kerja' => $kh['hari_kerja'],
            ]);

            // Seed Pejabat Konsul Fiktif
            if ($kh['kota'] === 'Dublin') {
                PejabatKonsul::create([
                    'konsul_id' => $createdKh->id,
                    'nama' => 'Sir William Gallagher',
                    'gelar_jabatan' => 'Konsul Kehormatan RI di Dublin',
                    'alamat' => 'Killiney, Co. Dublin, Ireland',
                    'no_telp' => '+353-86-123-4567'
                ]);
            } else {
                PejabatKonsul::create([
                    'konsul_id' => $createdKh->id,
                    'nama' => 'Robert "Bob" Miller, Esq.',
                    'gelar_jabatan' => 'Konsul Kehormatan RI di Miami',
                    'alamat' => 'Coral Gables, Florida, USA',
                    'no_telp' => '+1-305-555-7890'
                ]);
            }
        }

        // 6. Seed Sync Config & Logs (agar fitur sync dashboard tidak kosong dan berjalan)
        SyncConfig::create([
            'api_url' => 'https://api.kemlu-mock.web.id/v1/employees',
            'api_key' => 'mock_api_key_for_portfolio_showcase_12345',
            'http_method' => 'GET',
            'auto_sync_enabled' => false,
            'auto_sync_type' => 'weekly',
            'auto_sync_day' => 'Senin',
            'auto_sync_date' => null
        ]);

        SyncLog::create([
            'date' => now()->subDays(2),
            'method' => 'Manual',
            'status' => 'Success',
            'detail' => 'Berhasil sinkronisasi 10 data pegawai ke database lokal.'
        ]);

        SyncLog::create([
            'date' => now()->subDays(7),
            'method' => 'Auto',
            'status' => 'Success',
            'detail' => 'Auto-sync mingguan sukses memperbarui database perwakilan.'
        ]);
    }
}

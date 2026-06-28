<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UnitKerja;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        // 1. Buat Unit Kerja (Cek dulu agar tidak duplikat error)
        // Kita pakai firstOrCreate: kalau belum ada dibuat, kalau ada dipakai.
        $sdm = UnitKerja::firstOrCreate(
            ['kode_unit_kerja' => 'SDM01'],
            ['nama_unit_kerja' => 'Biro Sumber Daya Manusia', 'deskripsi' => 'Mengurus kepegawaian']
        );

        $keu = UnitKerja::firstOrCreate(
            ['kode_unit_kerja' => 'KEU01'],
            ['nama_unit_kerja' => 'Biro Keuangan', 'deskripsi' => 'Mengurus anggaran']
        );

        // 2. Buat User Admin
        // PERHATIKAN: Ganti 'name' menjadi 'username'

        User::create([
            'username' => 'Admin SDM',
            'email' => 'sdm@kemenlu.go.id',
            'password' => Hash::make('sdm123'),
            'role' => 'admin',
            'unit_kerja_id' => $sdm->id,
            'sso' => null,
        ]);

        User::create([
            'username' => 'Admin Keuangan',
            'email' => 'keuangan@kemenlu.go.id',
            'password' => Hash::make('keuangan123'),
            'role' => 'admin',
            'unit_kerja_id' => $keu->id,
            'sso' => null,
        ]);

        User::create([
            'username' => 'Super Admin',
            'email' => 'admin@kemenlu.go.id',
            'password' => Hash::make('admin123'),
            'role' => 'superadmin',
            'unit_kerja_id' => null,
            'sso' => null,
        ]);
    }
}
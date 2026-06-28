<?php

namespace App\Models;

// 1. TAMBAHKAN BARIS INI
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    // 2. TAMBAHKAN 'HasApiTokens' DI DALAM SINI
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'password',
        'email',
        'role',
        'unit_kerja_id', // Ini kunci agar admin terikat ke divisinya
        'sso',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Cek apakah user adalah Super Admin
     */
    public function isSuperAdmin()
    {
        return $this->role === 'superadmin';
    }

    /**
     * Ambil daftar izin akses menu berdasarkan kode unit kerja
     */
    public function getPermissions()
    {
        // Jika Super Admin, kasih semua akses
        if ($this->isSuperAdmin()) {
            return ['all'];
        }

        $permissions = ['dashboard', 'data_unit_kerja', 'unit_kerja', 'pengaturan'];
        
        // Ambil kode unit kerja dari relasi
        $unit = $this->unitKerja;
        $kode = $unit ? $unit->kode_unit_kerja : '';

        // Jika diawali 04 (Luar Negeri), tambahkan akses Konsul Kehormatan
        if (str_starts_with($kode, '04')) {
            $permissions[] = 'konsul_kehormatan';
        }

        return $permissions;
    }

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // 3. Tambahkan Relasi ke Unit Kerja (Opsional tapi berguna nanti)
    public function unitKerja()
    {
        return $this->belongsTo(UnitKerja::class, 'unit_kerja_id');
    }
}
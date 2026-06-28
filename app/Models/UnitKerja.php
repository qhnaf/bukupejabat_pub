<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use function PHPUnit\Framework\returnArgument;

class UnitKerja extends Model
{
    //
    use HasFactory;

    protected $table = 'unit_kerja';
    protected $guarded = ['id'];

    protected $fillable = [
        'kode_unit_kerja',
        'nama_unit_kerja',
        'deskripsi',
        'alamat',
        'telepon',
        'fax',
        'email',
        'website',
        'hari_kerja',
        'beda_jam',
        'musim_panas',
        'musim_dingin'
    ];

    // Satu unit kerja punya banyak pegawai
    public function pegawai()
    {
        return $this->hasMany(Pegawai::class, 'unit_kerja_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'unit_kerja_id');
    }
}
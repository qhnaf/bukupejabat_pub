<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KonsulKehormatan extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_kerja_id', 'negara', 'kota', 'alamat', 'no_telp', 'fax', 'email', 'website', 'hari_kerja'
    ];

    public function pejabats()
    {
        return $this->hasMany(PejabatKonsul::class, 'konsul_id');
    }
}

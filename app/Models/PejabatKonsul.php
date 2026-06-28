<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PejabatKonsul extends Model
{
    use HasFactory;

    protected $fillable = [
        'konsul_id', 'nama', 'gelar_jabatan', 'alamat', 'no_telp'
    ];

    public function konsul()
    {
        return $this->belongsTo(KonsulKehormatan::class, 'konsul_id');
    }
}

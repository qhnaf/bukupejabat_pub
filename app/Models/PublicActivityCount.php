<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicActivityCount extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'date',
        'type',
        'count',
    ];
}

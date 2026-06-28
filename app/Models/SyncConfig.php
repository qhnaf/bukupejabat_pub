<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_url',
        'api_key',
        'http_method',
        'auto_sync_enabled',
        'auto_sync_type',
        'auto_sync_day',
        'auto_sync_date',
    ];

    protected $casts = [
        'auto_sync_enabled' => 'boolean',
        'auto_sync_date' => 'integer',
    ];
}

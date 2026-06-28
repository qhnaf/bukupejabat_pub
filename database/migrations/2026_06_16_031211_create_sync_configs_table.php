<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_configs', function (Blueprint $table) {
            $table->id();
            $table->string('api_url')->nullable();
            $table->string('api_key')->nullable();
            $table->string('http_method')->default('GET');
            $table->boolean('auto_sync_enabled')->default(false);
            $table->string('auto_sync_type')->default('weekly');
            $table->string('auto_sync_day')->nullable();
            $table->integer('auto_sync_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_configs');
    }
};

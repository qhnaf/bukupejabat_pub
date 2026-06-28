<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('unit_kerja', function (Blueprint $table) {
            // Menambahkan kolom musim_panas dan musim_dingin (boleh kosong / nullable)
            $table->string('musim_panas')->nullable()->after('beda_jam');
            $table->string('musim_dingin')->nullable()->after('musim_panas');
        });
    }

    public function down()
    {
        Schema::table('unit_kerja', function (Blueprint $table) {
            $table->dropColumn(['musim_panas', 'musim_dingin']);
        });
    }
};
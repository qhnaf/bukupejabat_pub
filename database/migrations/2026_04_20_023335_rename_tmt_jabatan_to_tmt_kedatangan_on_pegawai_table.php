<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->renameColumn('tmt_jabatan', 'tmt_kedatangan');
        });
    }

    public function down()
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->renameColumn('tmt_kedatangan', 'tmt_jabatan');
        });
    }
};
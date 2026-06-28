<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('pegawai', function (Blueprint $table) {
            // Menambahkan kolom baru setelah no_handphone
            $table->string('bobot')->nullable()->after('no_handphone');
            $table->text('wisma')->nullable()->after('bobot');
            $table->date('tmt_jabatan')->nullable()->after('wisma');
            $table->date('tmt_credential')->nullable()->after('tmt_jabatan');
        });
    }

    public function down()
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropColumn(['bobot', 'wisma', 'tmt_jabatan', 'tmt_credential']);
        });
    }
};

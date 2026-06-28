<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pejabat_konsuls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konsul_id')->constrained('konsul_kehormatans')->onDelete('cascade');
            $table->string('nama');
            $table->string('gelar_jabatan')->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_telp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pejabat_konsuls');
    }
};

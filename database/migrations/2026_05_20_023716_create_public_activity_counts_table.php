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
        Schema::create('public_activity_counts', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('type', ['preview', 'download']);
            $table->unsignedInteger('count')->default(0);
            $table->timestamps();
            
            $table->unique(['date', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_activity_counts');
    }
};

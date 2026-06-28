<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Kita hanya menyuruh Laravel menjalankan AdminSeeder
        // AdminSeeder.php Anda sudah benar (sudah ada emailnya)
        $this->call([
            AdminSeeder::class,
        ]);
    }
}
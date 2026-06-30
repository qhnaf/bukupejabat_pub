<?php

// Pastikan direktori compile view sudah ada di folder /tmp yang writable
if (!is_dir('/tmp/views')) {
    mkdir('/tmp/views', 0755, true);
}

// Log request info to Vercel stderr
file_put_contents('php://stderr', "VERCEL LOGS - REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'null') . " | PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'null') . " | METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? 'null') . "\n");

// Forward Vercel requests to the normal Laravel entry point
require __DIR__ . '/../public/index.php';

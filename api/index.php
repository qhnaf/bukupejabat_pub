<?php

// Pastikan direktori compile view sudah ada di folder /tmp yang writable
if (!is_dir('/tmp/views')) {
    mkdir('/tmp/views', 0755, true);
}

// Forward Vercel requests to the normal Laravel entry point
require __DIR__ . '/../public/index.php';

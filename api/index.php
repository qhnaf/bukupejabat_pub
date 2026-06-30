<?php

// Pastikan direktori compile view sudah ada di folder /tmp yang writable
if (!is_dir('/tmp/views')) {
    mkdir('/tmp/views', 0755, true);
}

// Fix Vercel's api subfolder routing stripping issue in Symfony/Laravel
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Forward Vercel requests to the normal Laravel entry point
require __DIR__ . '/../public/index.php';

<?php
// Konfigurasi Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'db_manajemen_tugas');
define('DB_USER', 'root'); // Ganti jika user Anda berbeda
define('DB_PASS', 'root'); // Ganti jika password Anda berbeda

// Membuat koneksi PDO
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    // Set mode error PDO ke exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Tampilkan pesan error jika koneksi gagal
    die("ERROR: Tidak dapat terhubung ke database. " . $e->getMessage());
}
?>
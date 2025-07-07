<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Mulai session di setiap halaman
session_start();

// Muat autoloader dari Composer
require_once __DIR__ . '/vendor/autoload.php';

// Muat variabel lingkungan dari .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Konfigurasi Database dari .env
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);

// Kredensial Google OAuth dari .env
define('GOOGLE_CLIENT_ID', $_ENV['GOOGLE_CLIENT_ID']);
define('GOOGLE_CLIENT_SECRET', $_ENV['GOOGLE_CLIENT_SECRET']);

// Kredensial GitHub OAuth dari .env
define('GITHUB_CLIENT_ID', $_ENV['GITHUB_CLIENT_ID']);
define('GITHUB_CLIENT_SECRET', $_ENV['GITHUB_CLIENT_SECRET']);

// URL Redirect (harus sama dengan yang didaftarkan di Google/GitHub)
define('REDIRECT_URL', 'http://localhost:8888/sistem-manajemen-tugas/callback.php');

// Membuat koneksi PDO
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("ERROR: Tidak dapat terhubung ke database. " . $e->getMessage());
}
?>
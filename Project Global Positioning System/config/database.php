<?php
/**
 * Konfigurasi Koneksi Database MySQL menggunakan PDO
 * Proyek GPS Wisata & Kuliner DIY
 */

// Konfigurasi Database XAMPP Default
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'gps_diy';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
];

$dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // Tangani kegagalan koneksi tanpa membocorkan kredensial rahasia ke publik
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Gagal terhubung ke database MySQL. Pastikan layanan MySQL di XAMPP telah aktif dan database "gps_diy" telah diimpor melalui phpMyAdmin.',
        'debug'   => (defined('APP_DEBUG') && APP_DEBUG) ? $e->getMessage() : null
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

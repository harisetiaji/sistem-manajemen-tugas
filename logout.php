<?php
require_once 'config.php';

// Hancurkan semua data sesi
session_destroy();

// Redirect ke halaman utama
header('Location: index.php');
exit;
?>
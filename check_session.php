<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'loggedIn' => true,
        'userId' => $_SESSION['user_id'],
        'nama' => $_SESSION['user_nama']
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
?>
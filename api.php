<?php
require 'config.php';

// Amankan API: periksa apakah pengguna sudah login
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Anda harus login untuk mengakses API.']);
    exit;
}

$userId = $_SESSION['user_id'];
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT id, teks, selesai FROM tugas WHERE user_id = ? ORDER BY tanggal_dibuat DESC");
            $stmt->execute([$userId]);
            $tugas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $tugas]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'update') {
                $id = $data['id'] ?? 0;
                $selesai = $data['selesai'] ?? false;

                $stmt = $pdo->prepare("UPDATE tugas SET selesai = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$selesai, $id, $userId]);
                echo json_encode(['status' => 'success']);

            } else {
                $teks = $data['teks'] ?? '';
                if (empty($teks)) throw new Exception('Teks tugas tidak boleh kosong.');

                $stmt = $pdo->prepare("INSERT INTO tugas (teks, user_id) VALUES (?, ?)");
                $stmt->execute([$teks, $userId]);
                $newId = $pdo->lastInsertId();
                echo json_encode(['status' => 'success', 'data' => ['id' => $newId, 'teks' => $teks, 'selesai' => false]]);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? 0;
            if (empty($id)) throw new Exception('ID tugas tidak valid.');

            $stmt = $pdo->prepare("DELETE FROM tugas WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['status' => 'success']);
            break;

        default:
            throw new Exception('Metode request tidak valid.');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
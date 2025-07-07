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
            $stmt = $pdo->prepare("SELECT id, teks, selesai, status, card_color, assignee_label FROM tugas WHERE user_id = ? ORDER BY tanggal_dibuat DESC");
            $stmt->execute([$userId]);
            $tugas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $tugas]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'update') {
                $id = $data['id'] ?? 0;
                $selesai = $data['selesai'] ?? null;
                $status = $data['status'] ?? null;
                $cardColor = $data['card_color'] ?? null;
                $assigneeLabel = $data['assignee_label'] ?? null;

                $updateFields = [];
                $params = [];

                if ($selesai !== null) {
                    $updateFields[] = 'selesai = ?';
                    $params[] = $selesai;
                }
                if ($status !== null) {
                    $updateFields[] = 'status = ?';
                    $params[] = $status;
                }
                if ($cardColor !== null) {
                    $updateFields[] = 'card_color = ?';
                    $params[] = $cardColor;
                }
                if ($assigneeLabel !== null) {
                    $updateFields[] = 'assignee_label = ?';
                    $params[] = $assigneeLabel;
                }

                if (empty($updateFields)) {
                    throw new Exception('Tidak ada data untuk diperbarui.');
                }

                $sql = "UPDATE tugas SET " . implode(', ', $updateFields) . " WHERE id = ? AND user_id = ?";
                $params[] = $id;
                $params[] = $userId;

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['status' => 'success']);

            } else {
                $teks = $data['teks'] ?? '';
                $cardColor = $data['card_color'] ?? '#ffffff'; // Default white
                $assigneeLabel = $data['assignee_label'] ?? null;

                if (empty($teks)) throw new Exception('Teks tugas tidak boleh kosong.');

                $stmt = $pdo->prepare("INSERT INTO tugas (teks, user_id, status, card_color, assignee_label) VALUES (?, ?, 'inisiasi', ?, ?)");
                $stmt->execute([$teks, $userId, $cardColor, $assigneeLabel]);
                $newId = $pdo->lastInsertId();
                echo json_encode(['status' => 'success', 'data' => ['id' => $newId, 'teks' => $teks, 'selesai' => false, 'status' => 'inisiasi', 'card_color' => $cardColor, 'assignee_label' => $assigneeLabel]]);
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
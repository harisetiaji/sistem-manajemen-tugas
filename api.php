<?php
require 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            // Mengambil semua tugas
            $stmt = $pdo->query("SELECT id, teks, selesai FROM tugas ORDER BY tanggal_dibuat DESC");
            $tugas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $tugas]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'update') {
                // Memperbarui status selesai
                $id = $data['id'] ?? 0;
                $selesai = $data['selesai'] ?? false;

                $stmt = $pdo->prepare("UPDATE tugas SET selesai = ? WHERE id = ?");
                $stmt->execute([$selesai, $id]);
                echo json_encode(['status' => 'success']);

            } else {
                // Menambah tugas baru
                $teks = $data['teks'] ?? '';
                if (empty($teks)) {
                    throw new Exception('Teks tugas tidak boleh kosong.');
                }
                $stmt = $pdo->prepare("INSERT INTO tugas (teks) VALUES (?)");
                $stmt->execute([$teks]);
                $newId = $pdo->lastInsertId();
                echo json_encode(['status' => 'success', 'data' => ['id' => $newId, 'teks' => $teks, 'selesai' => false]]);
            }
            break;

        case 'DELETE':
            // Menghapus tugas
            $id = $_GET['id'] ?? 0;
            if (empty($id)) {
                throw new Exception('ID tugas tidak valid.');
            }
            $stmt = $pdo->prepare("DELETE FROM tugas WHERE id = ?");
            $stmt->execute([$id]);
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
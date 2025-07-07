<?php
require 'config.php';

// Secure API: Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to access the API.']);
    exit;
}

$userId = $_SESSION['user_id'];
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

try {
    switch ($action) {
        // == PROJECT ACTIONS ==
        case 'get_projects':
            $stmt = $pdo->prepare("SELECT id, project_name FROM projects WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $projects]);
            break;

        case 'create_project':
            $projectName = $data['project_name'] ?? '';
            if (empty($projectName)) throw new Exception('Project name cannot be empty.');

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO projects (user_id, project_name) VALUES (?, ?)");
            $stmt->execute([$userId, $projectName]);
            $newProjectId = $pdo->lastInsertId();

            // Create default groups for the new project
            $defaultGroups = ['To Do', 'In Progress', 'Done'];
            $stmt = $pdo->prepare("INSERT INTO card_groups (project_id, group_name, `order`) VALUES (?, ?, ?)");
            foreach ($defaultGroups as $index => $groupName) {
                $stmt->execute([$newProjectId, $groupName, $index]);
            }
            $pdo->commit();

            echo json_encode(['status' => 'success', 'data' => ['id' => $newProjectId, 'project_name' => $projectName]]);
            break;

        // == BOARD ACTIONS ==
        case 'get_board_data':
            $projectId = $_GET['project_id'] ?? 0;
            if (empty($projectId)) throw new Exception('Invalid Project ID.');

            // Verify user has access to this project
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$projectId, $userId]);
            if ($stmt->rowCount() === 0) {
                http_response_code(403); // Forbidden
                throw new Exception('Access denied to this project.');
            }

            // Fetch groups
            $stmt = $pdo->prepare("SELECT id, group_name, `order` FROM card_groups WHERE project_id = ? ORDER BY `order` ASC");
            $stmt->execute([$projectId]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch tasks for these groups
            $stmt = $pdo->prepare("SELECT id, teks, group_id, card_color, assignee_label FROM tugas WHERE group_id IN (SELECT id FROM card_groups WHERE project_id = ?) ORDER BY tanggal_dibuat DESC");
            $stmt->execute([$projectId]);
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Organize tasks by group_id for easier frontend processing
            $tasksByGroup = [];
            foreach ($tasks as $task) {
                $tasksByGroup[$task['group_id']][] = $task;
            }

            echo json_encode(['status' => 'success', 'data' => ['groups' => $groups, 'tasks' => $tasksByGroup]]);
            break;

        // == CARD (TUGAS) ACTIONS ==
        case 'create_task':
            $teks = $data['teks'] ?? '';
            $groupId = $data['group_id'] ?? 0;
            if (empty($teks) || empty($groupId)) throw new Exception('Task text and group are required.');

            $stmt = $pdo->prepare("INSERT INTO tugas (teks, user_id, group_id, card_color, assignee_label) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$teks, $userId, $groupId, $data['card_color'] ?? '#ffffff', $data['assignee_label'] ?? null]);
            $newId = $pdo->lastInsertId();
            echo json_encode(['status' => 'success', 'data' => ['id' => $newId]]);
            break;

        case 'update_task': // Handles text, color, assignee updates
            $id = $data['id'] ?? 0;
            if (empty($id)) throw new Exception('Task ID is required for updates.');

            // Verify ownership
            $stmt = $pdo->prepare("SELECT user_id FROM tugas WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetchColumn() != $userId) {
                http_response_code(403);
                throw new Exception('Access denied to update this task.');
            }

            $allowedFields = ['teks', 'card_color', 'assignee_label'];
            $updateFields = [];
            $params = [];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "`{$field}` = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updateFields)) {
                throw new Exception('No valid fields provided for update.');
            }

            $sql = "UPDATE tugas SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['status' => 'success', 'message' => 'Task updated successfully.']);
            break;

        case 'move_task':
            $taskId = $data['task_id'] ?? 0;
            $newGroupId = $data['new_group_id'] ?? 0;
            $oldGroupId = $data['old_group_id'] ?? 0;

            if (empty($taskId) || empty($newGroupId) || empty($oldGroupId)) throw new Exception('Invalid data for moving task.');

            $stmt = $pdo->prepare("UPDATE tugas SET group_id = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$newGroupId, $taskId, $userId]);

            // Log the move to history
            $stmt = $pdo->prepare("SELECT group_name FROM card_groups WHERE id = ?");
            $stmt->execute([$oldGroupId]);
            $oldGroupName = $stmt->fetchColumn();

            $stmt->execute([$newGroupId]);
            $newGroupName = $stmt->fetchColumn();

            if ($oldGroupName && $newGroupName) {
                $stmt = $pdo->prepare("INSERT INTO tugas_history (task_id, old_group, new_group, user_id) VALUES (?, ?, ?, ?)");
                $stmt->execute([$taskId, $oldGroupName, $newGroupName, $userId]);
            }

            echo json_encode(['status' => 'success']);
            break;

        case 'delete_task':
            $taskId = $_GET['task_id'] ?? 0;
            if (empty($taskId)) throw new Exception('Invalid Task ID.');
            $stmt = $pdo->prepare("DELETE FROM tugas WHERE id = ? AND user_id = ?");
            $stmt->execute([$taskId, $userId]);
            echo json_encode(['status' => 'success']);
            break;

        case 'create_card_group':
            $projectId = $data['project_id'] ?? 0;
            $groupName = $data['group_name'] ?? '';
            if (empty($projectId) || empty($groupName)) throw new Exception('Project ID and group name are required.');

            // Verify user has access to this project
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$projectId, $userId]);
            if ($stmt->rowCount() === 0) {
                http_response_code(403); // Forbidden
                throw new Exception('Access denied to this project.');
            }

            // Determine the order for the new group
            $stmt = $pdo->prepare("SELECT MAX(`order`) FROM card_groups WHERE project_id = ?");
            $stmt->execute([$projectId]);
            $maxOrder = $stmt->fetchColumn();
            $newOrder = ($maxOrder === null) ? 0 : $maxOrder + 1;

            $stmt = $pdo->prepare("INSERT INTO card_groups (project_id, group_name, `order`) VALUES (?, ?, ?)");
            $stmt->execute([$projectId, $groupName, $newOrder]);
            $newGroupId = $pdo->lastInsertId();

            echo json_encode(['status' => 'success', 'data' => ['id' => $newGroupId, 'group_name' => $groupName, 'order' => $newOrder]]);
            break;

        case 'get_task_history':
            $taskId = $_GET['task_id'] ?? 0;
            if (empty($taskId)) throw new Exception('Invalid Task ID.');

            // Verify user has access to this task
            $stmt = $pdo->prepare("SELECT user_id FROM tugas WHERE id = ?");
            $stmt->execute([$taskId]);
            if ($stmt->fetchColumn() != $userId) {
                http_response_code(403);
                throw new Exception('Access denied.');
            }

            $stmt = $pdo->prepare("
                SELECT h.timestamp, h.old_group, h.new_group, u.nama
                FROM tugas_history h
                JOIN users u ON h.user_id = u.id
                WHERE h.task_id = ?
                ORDER BY h.timestamp ASC
            ");
            $stmt->execute([$taskId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $history]);
            break;

        default:
            throw new Exception('Invalid API action.');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

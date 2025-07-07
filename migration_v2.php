<?php
require 'config.php';

try {
    // Start a transaction
    $pdo->beginTransaction();

    echo "Starting database migration...\n";

    // 1. Create 'projects' table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            project_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=INNODB;
    ");
    echo "1. `projects` table created successfully.\n";

    // 2. Create 'card_groups' table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS card_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            group_name VARCHAR(255) NOT NULL,
            `order` INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        ) ENGINE=INNODB;
    ");
    echo "2. `card_groups` table created successfully.\n";

    // 3. Alter 'tugas' table
    // Check if the 'status' column exists before trying to drop it
    $stmt = $pdo->query("SHOW COLUMNS FROM tugas LIKE 'status'");
    if ($stmt->rowCount() > 0) {
        echo "Disabling foreign key checks to truncate tables...\n";
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");

        $pdo->exec("TRUNCATE TABLE tugas_history;");
        $pdo->exec("TRUNCATE TABLE tugas;");
        echo "   - `tugas` and `tugas_history` tables truncated.\n";

        $pdo->exec("ALTER TABLE tugas DROP COLUMN status;");
        echo "   - Dropped `status` column from `tugas`.\n";

        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
        echo "Re-enabled foreign key checks.\n";
    }

    // Check if 'group_id' column exists before adding it
    $stmt = $pdo->query("SHOW COLUMNS FROM tugas LIKE 'group_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("
            ALTER TABLE tugas ADD COLUMN group_id INT NOT NULL AFTER user_id;
        ");
        // We can't add the foreign key yet if the card_groups table is empty or the key isn't set.
        // For now, we'll add the column and handle the key logic in the application.
        // A better approach is to add it directly:
        // ALTER TABLE tugas ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES card_groups(id) ON DELETE CASCADE;
        // But this requires existing groups. We will handle this in the app logic for now.
        echo "   - Added `group_id` column to `tugas`.\n";
    }
    echo "3. `tugas` table altered successfully.\n";


    // 4. Alter 'tugas_history' table
    $stmt = $pdo->query("SHOW COLUMNS FROM tugas_history LIKE 'old_status'");
    if ($stmt->rowCount() > 0) {
        $pdo->exec("ALTER TABLE tugas_history CHANGE old_status old_group VARCHAR(255) NOT NULL;");
        echo "   - Renamed `old_status` to `old_group`.\n";
    }
    $stmt = $pdo->query("SHOW COLUMNS FROM tugas_history LIKE 'new_status'");
    if ($stmt->rowCount() > 0) {
        $pdo->exec("ALTER TABLE tugas_history CHANGE new_status new_group VARCHAR(255) NOT NULL;");
        echo "   - Renamed `new_status` to `new_group`.\n";
    }
    echo "4. `tugas_history` table altered successfully.\n";


    // Commit the transaction
    $pdo->commit();
    echo "\nMigration completed successfully!\n";

} catch (Exception $e) {
    // An error occurred; rollback the transaction
    $pdo->rollBack();
    die("ERROR: Migration failed. " . $e->getMessage());
}
?>
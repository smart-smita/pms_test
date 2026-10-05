<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $mysqli = new mysqli("127.0.0.1", "root", "", "gaptm", 3306);
    echo "MySQL connected.\n";
    
    $sql = file_get_contents(__DIR__ . "/database/migrations/03_material_management.sql");
    $mysqli->multi_query($sql);
    while ($mysqli->more_results() && $mysqli->next_result()) {
        // flush multi_queries
    }
    echo "Migration 03 applied successfully.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}

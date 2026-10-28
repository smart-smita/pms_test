<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $mysqli = new mysqli("127.0.0.1", "root", "", "gaptm", 3306);
    echo "MySQL connected on 3306 successfully.\n";
} catch (Exception $e) {
    echo "MySQL connection failed on 3306: " . $e->getMessage() . "\n";
}

try {
    $mysqli = new mysqli("127.0.0.1", "root", "", "gaptm", 3307);
    echo "MariaDB connected on 3307 successfully.\n";
} catch (Exception $e) {
    echo "MariaDB connection failed on 3307: " . $e->getMessage() . "\n";
}

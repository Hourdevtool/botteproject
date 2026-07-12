<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/');
$dotenv->load();

$dbConfig = new Database();
$db = $dbConfig->connect();

echo "<h2>Staff Database Debug (tb_user)</h2>";

$stmt = $db->prepare("SELECT * FROM tb_user");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($users) == 0) {
    echo "<p>❌ ไม่พบข้อมูลใดๆ ในตาราง tb_user เลย (แปลว่าไม่มี staff ให้ล็อกอิน)</p>";
}

foreach ($users as $u) {
    echo "<hr>";
    echo "<b>ID:</b> " . $u['id'] . "<br>";
    echo "<b>Name:</b> " . $u['op_name'] . "<br>";
    echo "<b>Phone:</b> " . $u['phonenumber'] . "<br>";
    echo "<b>Permission:</b> " . $u['permission'] . " (ถ้าเป็น 0 จะล็อกอินไม่ได้ ต้องเป็น 1)<br>";
    echo "<b>Password in DB:</b> " . htmlspecialchars($u['password']) . "<br>";
    
    // Test password verify
    $is_match = password_verify("1234", $u['password']);
    if ($is_match) {
        echo "<b>Login Test (1234):</b> <span style='color:green;'>✅ ผ่าน! (รหัสผ่านถูกต้อง)</span><br>";
    } else {
        echo "<b>Login Test (1234):</b> <span style='color:red;'>❌ ไม่ผ่าน! (รหัสผ่านไม่ใช่ 1234 หรือก็อปปี้แฮชมาไม่ถูกต้อง)</span><br>";
    }
}
?>

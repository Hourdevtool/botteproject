<?php
use Config\Database;
require_once __DIR__ . '/vendor/autoload.php';

spl_autoload_register(function($class){
    $base_dir = __DIR__ . '/';
    $classPath = str_replace(['App\\', 'Config\\', '\\'], ['src/', 'config/', '/'], $class);
    $file = $base_dir . $classPath . '.php';
    if(file_exists($file)){
        require $file;
    }
});

$db = (new Database())->connect();

// Fetch config
$stmt = $db->prepare("SELECT * FROM tb_config WHERE m_id = 1");
$stmt->execute();
$config = $stmt->fetch(PDO::FETCH_ASSOC);

print_r($config);

// Try updating
if ($config) {
    echo "Updating...\n";
    $sql = "UPDATE tb_config SET `type` = :type WHERE `id` = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute([':type' => 'money', ':id' => $config['id']]);
    echo "Rows affected: " . $stmt->rowCount() . "\n";
} else {
    echo "No config found for m_id=1. Creating...\n";
    $sql = "INSERT INTO tb_config SET `m_id` = :m_id, `type` = :type";
    $stmt = $db->prepare($sql);
    $stmt->execute([':m_id' => 1, ':type' => 'money']);
    echo "Rows affected: " . $stmt->rowCount() . "\n";
}

// Fetch again
$stmt = $db->prepare("SELECT * FROM tb_config WHERE m_id = 1");
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));

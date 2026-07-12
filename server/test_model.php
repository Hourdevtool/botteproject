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

$model = new \App\Models\machine\Config();
$config = $model->getByMachineId(1);
echo "Config before:\n";
print_r($config);

if ($config) {
    echo "Updating...\n";
    $model->Update($config['id'], ['type' => 'money']);
} else {
    echo "Creating...\n";
    $model->Create(['m_id' => 1, 'type' => 'money', 'allow' => 0]);
}

$config2 = $model->getByMachineId(1);
echo "Config after:\n";
print_r($config2);

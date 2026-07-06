<?php

use Dotenv\Dotenv;

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/');
$dotenv->load();


date_default_timezone_set('Asia/Bangkok');

$envOrigins = isset($_ENV['ALLOW_ORIGNIN']) ? $_ENV['ALLOW_ORIGNIN'] : 'http://localhost:5173';

$allowedOrigins = array_map('trim', explode(',', $envOrigins));
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: " . (isset($allowedOrigins[0]) ? $allowedOrigins[0] : '*'));
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, GET, POST, PUT, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// class src auto loading

spl_autoload_register(function ($class) {
    $base_dir = __DIR__ . '/';

    $resolvedClass = $class;
    $resolvedClass = str_replace('App\\Middleware\\', 'src/Middlewares/', $resolvedClass);
    $resolvedClass = str_replace('App\\', 'src/', $resolvedClass);
    $resolvedClass = str_replace('Config\\', 'config/', $resolvedClass);
    $file = $base_dir . str_replace('\\', '/', $resolvedClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});


//  เรียกใช้งาน api

$router = new \App\Router();

require_once __DIR__ . '/src/Routes/api.php';


$url = isset($_GET['url']) ? rtrim($_GET['url'], '/') : '';
$method = $_SERVER['REQUEST_METHOD'];

$router->dispatch($method, $url);
?>
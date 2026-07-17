<?php
$host = '127.0.0.1';
$port = '3307';
$db   = 'bottle';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$pdo = new PDO($dsn, $user, $pass);
$stmt = $pdo->query('SELECT * FROM tb_config');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

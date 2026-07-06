<?php

namespace App\Database;

class Schema {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function createTables() {
        $queries = [
            // 1. tb_user
            "CREATE TABLE IF NOT EXISTS tb_user (
                id INT AUTO_INCREMENT PRIMARY KEY,
                op_name TEXT NOT NULL,
                email TEXT,
                phonenumber TEXT,
                password TEXT NOT NULL,
                role ENUM('operator','admin') DEFAULT 'operator',
                permission BOOLEAN DEFAULT FALSE,
                createat DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ประกอบการ'",

            // 2. tb_machine
            "CREATE TABLE IF NOT EXISTS tb_machine (
                id INT AUTO_INCREMENT PRIMARY KEY,
                op_id INT,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                location TEXT,
                count INT DEFAULT 0 COMMENT 'จำนวนขวด',
                createat DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (op_id) REFERENCES tb_user(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลเครื่อง'",

            // 3. tb_config
            "CREATE TABLE IF NOT EXISTS tb_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                m_id INT,
                type ENUM('point', 'money') DEFAULT 'point' COMMENT 'เลือกประเภทเป็นแบบเก็บเเต้มหรือเสียเงิน',
                allow BOOLEAN DEFAULT TRUE COMMENT 'เปิดสิทธิการใช้งาน',
                FOREIGN KEY (m_id) REFERENCES tb_machine(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตั้งค่าตัวเครื่อง'",

            // 4. tb_pointrate
            "CREATE TABLE IF NOT EXISTS tb_pointrate (
                id INT AUTO_INCREMENT PRIMARY KEY,
                m_id INT,
                `key` TEXT NOT NULL,
                `value` FLOAT DEFAULT 0,
                FOREIGN KEY (m_id) REFERENCES tb_machine(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตั้งค่าpoint'",

            "CREATE TABLE IF NOT EXISTS tb_member (
                id INT AUTO_INCREMENT PRIMARY KEY,
                m_id INT,
                phonenumber TEXT NOT NULL,
                title TEXT,
                fname TEXT,
                lname TEXT,
                age INT,
                gender TEXT,
                localtion TEXT,
                point FLOAT DEFAULT 0,
                createat DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (m_id) REFERENCES tb_machine(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางลงทะเบียนผู้ใช้งาน'",

            "CREATE TABLE IF NOT EXISTS tb_pointlog (
                id INT AUTO_INCREMENT PRIMARY KEY,
                u_id INT,
                m_id INT,
                point FLOAT DEFAULT 0,
                createat DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (u_id) REFERENCES tb_member(id) ON DELETE SET NULL,
                FOREIGN KEY (m_id) REFERENCES tb_machine(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประวัติการใช้แต้ม'",

            // 7. tb_redeem_request
            "CREATE TABLE IF NOT EXISTS tb_redeem_request (
                id INT AUTO_INCREMENT PRIMARY KEY,
                u_id INT,
                m_id INT,
                amount FLOAT NOT NULL COMMENT 'จำนวนแต้ม/เงินที่ขอแลก',
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                createat DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (u_id) REFERENCES tb_member(id) ON DELETE SET NULL,
                FOREIGN KEY (m_id) REFERENCES tb_machine(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางคำขอแลกแต้ม/เงิน รอการอนุมัติ'",

        ];

        foreach ($queries as $sql) {
            try {
                $this->db->exec($sql);
                echo "Success: Created or verified table structure.\n";
            } catch (\PDOException $e) {
                echo "Error creating table: " . $e->getMessage() . "\n";
            }
        }
    }

    public function dropTables() {
        $queries = [
            "SET FOREIGN_KEY_CHECKS = 0",
            "DROP TABLE IF EXISTS tb_user",
            "DROP TABLE IF EXISTS tb_member",
            "DROP TABLE IF EXISTS tb_pointrate",
            "DROP TABLE IF EXISTS tb_config",
            "DROP TABLE IF EXISTS tb_machine",
            "DROP TABLE IF EXISTS tb_pointlog",
            "DROP TABLE IF EXISTS tb_redeem_request",
            "SET FOREIGN_KEY_CHECKS = 1"
        ];

        foreach ($queries as $sql) {
            $this->db->exec($sql);
        }
        echo "All tables dropped.\n";
    }
}

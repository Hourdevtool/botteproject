<?php

namespace App\Controllers;

use App\Models\machine\machine;
use App\Models\user\User;
use App\Models\machine\Config;

class AdminController extends BaseController
{
    protected $machineModel;
    protected $userModel;
    protected $configModel;

    public function __construct()
    {
        $this->machineModel = new machine();
        $this->userModel = new User();
        $this->configModel = new Config();
    }

    // ดูตำเเหน่งของตู้ทั้งหมได้แยกตามเจ้าของตู้
    public function getMachines()
    {
        // For simplicity, using raw SQL to join tb_machine and tb_user
        $db = (new \Config\Database())->connect();
        $sql = "SELECT m.*, u.op_name, u.email, c.allow, c.type 
                FROM tb_machine m 
                LEFT JOIN tb_user u ON m.op_id = u.id
                LEFT JOIN tb_config c ON m.id = c.m_id
                ORDER BY u.id, m.id";
        $stmt = $db->query($sql);
        $machines = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $this->jsonResponse([
            'status' => 'success',
            'data' => $machines
        ], 200);
    }

    // จัดการสถานนะเจ้าของตู้
    public function updateUserStatus($id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['permission']);
        
        $updated = $this->userModel->Update($id, ['permission' => $data['permission']]);
        if ($updated) {
            $this->jsonResponse(['status' => 'success', 'message' => 'อัปเดตสถานะเจ้าของตู้สำเร็จ'], 200);
        }
        $this->jsonResponse(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการอัปเดต'], 500);
    }

    // จัดการสถานะตู้ (เช่น เปิด/ปิดตู้โดยแอดมิน)
    public function updateMachineStatus($id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['status']);
        
        $updated = $this->machineModel->Update($id, ['status' => $data['status']]);
        if ($updated) {
            $this->jsonResponse(['status' => 'success', 'message' => 'อัปเดตสถานะตู้สำเร็จ'], 200);
        }
        $this->jsonResponse(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการอัปเดต'], 500);
    }

    // อนุมัติการออกตู้ใหม่เพื่อให้ใช้งานได้
    public function approveMachine($id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['allow']); // 1 or 0
        
        $config = $this->configModel->getByMachineId($id);
        if ($config) {
            $this->configModel->Update($config['id'], ['allow' => $data['allow']]);
        } else {
            $this->configModel->Create([
                'm_id' => $id,
                'allow' => $data['allow'],
                'type' => 'point'
            ]);
        }

        $this->jsonResponse(['status' => 'success', 'message' => 'อนุมัติตู้สำเร็จ'], 200);
    }

    // ดูสรุปผลข้อมูลได้
    public function getDashboardStats()
    {
        $db = (new \Config\Database())->connect();
        
        $totalMachines = $db->query("SELECT COUNT(*) FROM tb_machine")->fetchColumn();
        $totalOperators = $db->query("SELECT COUNT(*) FROM tb_user WHERE role='operator'")->fetchColumn();
        $totalBottles = $db->query("SELECT SUM(count) FROM tb_machine")->fetchColumn() ?: 0;
        
        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'total_machines' => $totalMachines,
                'total_operators' => $totalOperators,
                'total_bottles' => $totalBottles
            ]
        ], 200);
    }

    // ดูรายละเอียดข้อมูลของเจ้าของตู้ว่ามีทั้งหมดกี่ตู้บ้าง
    public function getOperators()
    {
        $db = (new \Config\Database())->connect();
        $sql = "SELECT u.id, u.op_name, u.email, u.phonenumber, u.permission, COUNT(m.id) as machine_count 
                FROM tb_user u 
                LEFT JOIN tb_machine m ON u.id = m.op_id 
                WHERE u.role = 'operator'
                GROUP BY u.id";
        $stmt = $db->query($sql);
        $operators = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $this->jsonResponse([
            'status' => 'success',
            'data' => $operators
        ], 200);
    }
}

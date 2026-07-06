<?php

namespace App\Controllers;

use App\Models\machine\machine;
use App\Models\machine\Config;
use App\Models\machine\Pointrate;
use App\Models\member\Member;

class OperatorController extends BaseController
{
    protected $machineModel;
    protected $configModel;
    protected $pointrateModel;
    protected $memberModel;

    public function __construct()
    {
        $this->machineModel = new machine();
        $this->configModel = new Config();
        $this->pointrateModel = new Pointrate();
        $this->memberModel = new Member();
    }

    // ตั้งค่าตู้ rate
    public function updateMachineConfig($id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['type']); // type: point or money

        if (!in_array($data['type'], ['money', 'point'])) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ประเภทการตั้งค่าต้องเป็น money หรือ point'], 400);
            return;
        }

        $rateKeys = ['clear', 'opaque', 'brown'];
        if ($data['type'] === 'money') {
            // เงินจะใช้ราคากลางจาก API กลาง ไม่อนุญาตให้ปรับเรทราคาที่นี่
        } elseif ($data['type'] === 'point') {
            if (!isset($data['rates']) || !is_array($data['rates'])) {
                $this->jsonResponse(['status' => 'error', 'message' => 'กรุณาส่ง rates สำหรับประเภท point'], 400);
                return;
            }
            foreach ($rateKeys as $key) {
                if (!isset($data['rates'][$key])) {
                    $this->jsonResponse(['status' => 'error', 'message' => "กรุณาระบุคะแนนสำหรับประเภท {$key} ทุกประเภท"], 400);
                    return;
                }
                if (floatval($data['rates'][$key]) < 1) {
                    $this->jsonResponse(['status' => 'error', 'message' => "คะแนนสำหรับประเภท {$key} ต้องไม่น้อยกว่า 1"], 400);
                    return;
                }
            }
        }

        $config = $this->configModel->getByMachineId($id);
        if ($config) {
            $this->configModel->Update($config['id'], ['type' => $data['type']]);
        } else {
            $this->configModel->Create([
                'm_id' => $id,
                'type' => $data['type'],
                'allow' => 0
            ]);
        }

        if ($data['type'] === 'point') {
            $this->pointrateModel->deleteByMachineId($id);
            foreach ($rateKeys as $key) {
                $this->pointrateModel->Create([
                    'm_id' => $id,
                    'key' => $key,
                    'value' => floatval($data['rates'][$key])
                ]);
            }
        }

        $this->jsonResponse(['status' => 'success', 'message' => 'อัปเดตการตั้งค่าสำเร็จ'], 200);
    }

    public function getMachineConfig($id)
    {
        $config = $this->configModel->getByMachineId($id);
        $rateRows = $this->pointrateModel->getByMachineId($id);
        $rateKeys = ['clear', 'opaque', 'brown'];
        $rates = array_fill_keys($rateKeys, 0);
        foreach ($rateRows as $row) {
            if (in_array($row['key'], $rateKeys, true)) {
                $rates[$row['key']] = floatval($row['value']);
            }
        }

        if (!$config) {
            $this->jsonResponse([
                'status' => 'success',
                'data' => [
                    'type' => 'point',
                    'rates' => $rates,
                ]
            ], 200);
            return;
        }

        $responseData = ['type' => $config['type'], 'rates' => $rates];
        if ($config['type'] === 'money') {
            $basePrices = [];
            foreach ($rates as $key => $value) {
                $basePrices[$key] = round($value / 0.8, 2);
            }
            $responseData['base_prices'] = $basePrices;
        }

        $this->jsonResponse(['status' => 'success', 'data' => $responseData], 200);
    }

    // ดูรายว่าตู้มีผู้ใช้งานกี่คน เเล้วสมาชิกเเต่ละคนเนี่ยมี point สะสมเท่าไหร่
    public function getMachineUsers($id)
    {
        $db = (new \Config\Database())->connect();
        
        $sql = "SELECT m.id, m.phonenumber, m.fname, m.lname, m.point, m.createat 
                FROM tb_member m 
                WHERE m.m_id = :m_id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':m_id' => $id]);
        $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $totalUsers = count($users);

        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'total_users' => $totalUsers,
                'members' => $users
            ]
        ], 200);
    }

    // ดูรายการคำขอแลกแต้ม/เงิน ที่รอการอนุมัติของตู้นั้น
    public function getRedeemRequests($id)
    {
        $redeemRequestModel = new \App\Models\machine\RedeemRequest();
        $requests = $redeemRequestModel->getPendingByMachineId($id);

        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'total_pending' => count($requests),
                'requests' => $requests
            ]
        ], 200);
    }

    // อนุมัติคำขอแลกแต้ม/เงิน (ตัดแต้ม + บันทึกประวัติ + ลบคำขอออกจากระบบ)
    public function approveRedeem($request_id)
    {
        $redeemRequestModel = new \App\Models\machine\RedeemRequest();
        $request = $redeemRequestModel->findById((int)$request_id);

        if (!$request) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบคำขอแลก'], 404);
            return;
        }

        if ($request['status'] !== 'pending') {
            $this->jsonResponse(['status' => 'error', 'message' => 'คำขอนี้ถูกดำเนินการไปแล้ว'], 400);
            return;
        }

        $member = $this->memberModel->findById((int)$request['u_id']);
        if (!$member) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบข้อมูลสมาชิก'], 404);
            return;
        }

        $amount = floatval($request['amount']);
        $currentPoint = floatval($member['point']);

        // เชื่อมต่อฐานข้อมูลเตรียมพร้อมสำหรับ Transaction หรือการลบข้อมูล
        $db = (new \Config\Database())->connect();

        if ($currentPoint < $amount) {
            // ถ้าแต้มไม่พอ ให้ทำการลบคำขอออกจากระบบทันที
            $sql = "DELETE FROM tb_redeem_request WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => (int)$request_id]);

            $this->jsonResponse(['status' => 'error', 'message' => 'แต้ม/ยอดเงินของสมาชิกไม่เพียงพอ คำขอถูกลบออกจากระบบอัตโนมัติ'], 400);
            return;
        }

        $db->beginTransaction();

        try {
            // 1. ตัดแต้มสมาชิก
            $newPoint = $currentPoint - $amount;
            $this->memberModel->Update($member['id'], ['point' => $newPoint]);

            // 2. บันทึกประวัติ Point Log (ค่าติดลบ = ใช้แต้มออกไป)
            $pointlogModel = new \App\Models\machine\Pointlog();
            $pointlogModel->Create([
                'u_id' => $member['id'],
                'm_id' => $request['m_id'],
                'point' => -$amount
            ]);

            // 3. ทำการลบคำขอแลกแต้มออกจากฐานข้อมูลทันทีเมื่อได้รับการอนุมัติเสร็จสิ้น
            $sql = "DELETE FROM tb_redeem_request WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => (int)$request_id]);

            $db->commit();

            $this->jsonResponse([
                'status' => 'success',
                'message' => 'อนุมัติการแลกสำเร็จ และลบคำขอออกจากระบบเรียบร้อยแล้ว',
                'data' => [
                    'redeemed_amount' => $amount,
                    'remaining_point' => $newPoint
                ]
            ], 200);
        } catch (\Exception $e) {
            $db->rollBack();
            $this->jsonResponse(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()], 500);
        }
    }

    // ยกเลิกคำขอแลกแต้ม/เงิน -> ลบออกจากฐานข้อมูลทันที
    public function rejectRedeem($request_id)
    {
        $redeemRequestModel = new \App\Models\machine\RedeemRequest();
        $request = $redeemRequestModel->findById((int)$request_id);

        if (!$request) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบคำขอแลก'], 404);
            return;
        }

        if ($request['status'] !== 'pending') {
            $this->jsonResponse(['status' => 'error', 'message' => 'คำขอนี้ถูกดำเนินการไปแล้ว'], 400);
            return;
        }

        $db = (new \Config\Database())->connect();
        $sql = "DELETE FROM tb_redeem_request WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => (int)$request_id]);

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'ยกเลิกและลบคำขอแลกแต้มออกจากระบบเรียบร้อยแล้ว'
        ], 200);
    }
}
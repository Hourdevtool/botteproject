<?php

namespace App\Controllers;

use App\Models\member\Member;
use App\Models\user\User;

class UserController extends BaseController
{
    protected $memberModel;
    private $secret_key;

    public function __construct()
    {
        $this->memberModel = new Member();
        $this->secret_key = $_ENV['JWT_SECRET'] ?? 'default_secret'; // In case env is not loaded in time
    }

    // ลงทะเบียน เเต่ละตู้ 
    public function register($m_id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['phonenumber', 'fname', 'lname']);

        // Check if already registered at this machine
        $existing = $this->memberModel->getByPhoneAndMachine($data['phonenumber'], $m_id);
        if ($existing) {
            $this->jsonResponse(['status' => 'error', 'message' => 'หมายเลขนี้ลงทะเบียนกับตู้นี้แล้ว'], 400);
        }

        $insertData = [
            'm_id' => $m_id,
            'phonenumber' => $data['phonenumber'],
            'fname' => $data['fname'],
            'lname' => $data['lname'],
            'age' => $data['age'] ?? null,
            'gender' => $data['gender'] ?? null,
            'localtion' => $data['localtion'] ?? null,
            'point' => 0
        ];

        $created = $this->memberModel->Create($insertData);

        if ($created) {
            // Fetch the newly created member to get the ID
            $member = $this->memberModel->getByPhoneAndMachine($data['phonenumber'], $m_id);
            
            if ($member) {
                // Generate token
                $payload = [
                    "member_id" => $member['id'],
                    "m_id" => $m_id,
                    "role" => "user",
                    "exp" => time() + (84600 * 30),
                ];

                $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
                $payloadEncoded = json_encode($payload);

                $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
                $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadEncoded));

                $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
                $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

                $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

                $this->jsonResponse([
                    'status' => 'success',
                    'message' => 'ลงทะเบียนสำเร็จ',
                    'token' => $jwt,
                    'data' => [
                        'id' => $member['id'],
                        'fname' => $member['fname'],
                        'lname' => $member['lname'],
                        'point' => $member['point']
                    ]
                ], 201);
            }
        }
        $this->jsonResponse(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการลงทะเบียน'], 500);
    }

    // เข้าสู่ระบบหน้าตู้ด้วยหมายเลขโทรศัพท์เท่านั้น
    public function login($m_id)
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['phonenumber']);

        $member = $this->memberModel->getByPhoneAndMachine($data['phonenumber'], $m_id);

        if ($member) {
            // Get machine config to determine type
            $configModel = new \App\Models\machine\Config();
            $config = $configModel->getByMachineId($m_id);
            $machine_type = $config ? $config['type'] : 'point';

            // Generate token
            $payload = [
                "member_id" => $member['id'],
                "m_id" => $m_id,
                "role" => "user",
                "exp" => time() + (84600 * 30),
            ];

            $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
            $payloadEncoded = json_encode($payload);

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadEncoded));

            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

            $this->jsonResponse([
                'status' => 'success',
                'message' => 'เข้าสู่ระบบสำเร็จ',
                'token' => $jwt,
                'data' => [
                    'id' => $member['id'],
                    'fname' => $member['fname'],
                    'lname' => $member['lname'],
                    'point' => $member['point'],
                    'machine_type' => $machine_type,
                    'phonenumber' => $member['phonenumber'] ?? null,
                    'age' => $member['age'] ?? null,
                    'gender' => $member['gender'] ?? null,
                    'localtion' => $member['localtion'] ?? null
                ]
            ], 200);
        }

        $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบหมายเลขนี้ในระบบ'], 404);
    }

    // ทำการรับขวดแล้วคำนวณแต้ม/เงิน
    public function deposit($m_id)
    {
        $auth = new \App\Middleware\AuthMiddleware();
        $payload = $auth->checkToken();

        if (!isset($payload['member_id']) || $payload['m_id'] != $m_id) {
            $this->jsonResponse(['status' => 'error', 'message' => 'Token ไม่ถูกต้องหรือตู้ไม่ตรงกัน'], 401);
        }

        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['type', 'weight']);

        $type = $data['type']; // clear, opaque, brown
        $weight = floatval($data['weight']);

        $configModel = new \App\Models\machine\Config();
        $config = $configModel->getByMachineId($m_id);

        if (!$config || !$config['allow']) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ตู้นี้ยังไม่เปิดให้บริการ'], 403);
        }

        $pointrateModel = new \App\Models\machine\Pointrate();
        $rates = $pointrateModel->getByMachineId($m_id);

        $rateValue = 0;
        foreach ($rates as $r) {
            if ($r['key'] === $type) {
                $rateValue = floatval($r['value']);
                break;
            }
        }

        if ($rateValue <= 0) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ไม่มีการตั้งค่าเรทราคาสำหรับขวดประเภทนี้'], 400);
        }

        // คำนวณแต้ม/เงิน
        $earned = $rateValue * $weight;

        // อัปเดต Member points
        $member = $this->memberModel->findById($payload['member_id']);
        $newPoint = floatval($member['point']) + $earned;
        $this->memberModel->Update($member['id'], ['point' => $newPoint]);

        // บันทึกประวัติ
        $pointlogModel = new \App\Models\machine\Pointlog();
        $pointlogModel->Create([
            'u_id' => $member['id'],
            'm_id' => $m_id,
            'point' => $earned
        ]);

        // อัปเดตยอดจำนวนขวดในตู้
        $machineModel = new \App\Models\machine\machine();
        $machine = $machineModel->findById($m_id);
        $newCount = intval($machine['count']) + 1;
        $machineModel->Update($m_id, ['count' => $newCount]);

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'รับขวดสำเร็จ',
            'data' => [
                'earned' => $earned,
                'total_point' => $newPoint
            ]
        ], 200);
    }

    // ทำการแลกแต้ม/แลกเงิน (ส่งคำขอ — รอเจ้าของตู้อนุมัติ)
    public function redeem($m_id)
    {
        $auth = new \App\Middleware\AuthMiddleware();
        $payload = $auth->checkToken();

        if (!isset($payload['member_id']) || $payload['m_id'] != $m_id) {
            $this->jsonResponse(['status' => 'error', 'message' => 'Token ไม่ถูกต้องหรือตู้ไม่ตรงกัน'], 401);
        }

        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['amount']);

        $amount = floatval($data['amount']);

        if ($amount <= 0) {
            $this->jsonResponse(['status' => 'error', 'message' => 'จำนวนที่ต้องการแลกต้องมากกว่า 0'], 400);
        }

        $member = $this->memberModel->findById($payload['member_id']);
        $currentPoint = floatval($member['point']);

        if ($currentPoint < $amount) {
            $this->jsonResponse(['status' => 'error', 'message' => 'แต้ม/ยอดเงิน ไม่เพียงพอสำหรับการแลก'], 400);
        }

        // บันทึกคำขอแลก — ยังไม่ตัดแต้ม รอให้เจ้าของตู้อนุมัติ
        $redeemRequestModel = new \App\Models\machine\RedeemRequest();
        $created = $redeemRequestModel->Create([
            'u_id' => $member['id'],
            'm_id' => $m_id,
            'amount' => $amount,
            'status' => 'pending'
        ]);

        if (!$created) {
            $this->jsonResponse(['status' => 'error', 'message' => 'ไม่สามารถส่งคำขอแลกได้'], 500);
        }

        $this->jsonResponse([
            'status' => 'pending',
            'message' => 'ส่งคำขอแลกสำเร็จ รอเจ้าของตู้อนุมัติ',
            'data' => [
                'requested_amount' => $amount,
                'current_point' => $currentPoint
            ]
        ], 200);
    }

    // ดู point ที่มีได้
    public function getProfile()
    {
        // Require auth middleware to parse token
        $auth = new \App\Middleware\AuthMiddleware();
        $payload = $auth->checkToken();

        if (isset($payload['member_id'])) {
            $member = $this->memberModel->findById($payload['member_id']);
            if ($member) {
                // Get machine config to determine type
                $m_id = $payload['m_id'] ?? null;
                $machine_type = 'point';
                if ($m_id) {
                    $configModel = new \App\Models\machine\Config();
                    $config = $configModel->getByMachineId($m_id);
                    if ($config) {
                        $machine_type = $config['type'];
                    }
                }

                $this->jsonResponse([
                    'status' => 'success',
                    'data' => [
                        'id' => $member['id'] ?? null,
                        'fname' => $member['fname'],
                        'lname' => $member['lname'],
                        'point' => $member['point'],
                        'machine_type' => $machine_type,
                        'phonenumber' => $member['phonenumber'] ?? null,
                        'age' => $member['age'] ?? null,
                        'gender' => $member['gender'] ?? null,
                        'localtion' => $member['localtion'] ?? null,
                        'createat' => $member['createat'] ?? null
                    ]
                ], 200);
                return;
            }
        }

        if (isset($payload['user_id'])) {
            $userModel = new User();
            $user = $userModel->findById((int) $payload['user_id']);

            if ($user) {
                $this->jsonResponse([
                    'status' => 'success',
                    'data' => [
                        'id' => $user['id'],
                        'role' => $user['role'] ?? 'operator',
                        'op_name' => $user['op_name'] ?? '',
                        'email' => $user['email'] ?? ''
                    ]
                ], 200);
                return;
            }
        }

        $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบข้อมูลผู้ใช้'], 404);
    }

    public function getUserProfileById($id)
    {
        $member = $this->memberModel->findById($id);
        if ($member) {
            $machine_type = 'point';
            $m_id = $member['m_id'] ?? null;
            if ($m_id) {
                $configModel = new \App\Models\machine\Config();
                $config = $configModel->getByMachineId($m_id);
                if ($config) {
                    $machine_type = $config['type'];
                }
            }

            $this->jsonResponse([
                'status' => 'success',
                'data' => [
                    'id' => $member['id'],
                    'fname' => $member['fname'],
                    'lname' => $member['lname'],
                    'point' => $member['point'],
                    'machine_type' => $machine_type,
                    'phonenumber' => $member['phonenumber'] ?? null,
                    'age' => $member['age'] ?? null,
                    'gender' => $member['gender'] ?? null,
                    'localtion' => $member['localtion'] ?? null,
                    'createat' => $member['createat'] ?? null
                ]
            ], 200);
            return;
        }

        $this->jsonResponse(['status' => 'error', 'message' => 'ไม่พบข้อมูลผู้ใช้'], 404);
    }

    public function getHistory()
    {
        $auth = new \App\Middleware\AuthMiddleware();
        $payload = $auth->checkToken();

        if (!isset($payload['member_id'])) {
            $this->jsonResponse(['status' => 'error', 'message' => 'Token ไม่ถูกต้อง'], 401);
        }

        $pointlogModel = new \App\Models\machine\Pointlog();
        $logs = $pointlogModel->getByUserId($payload['member_id']);

        $this->jsonResponse([
            'status' => 'success',
            'data' => $logs
        ], 200);
    }
}

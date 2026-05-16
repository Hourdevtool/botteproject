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

        $config = $this->configModel->getByMachineId($id);
        if ($config) {
            $this->configModel->Update($config['id'], ['type' => $data['type']]);
        } else {
            $this->configModel->Create([
                'm_id' => $id,
                'type' => $data['type'],
                'allow' => 0 // Default need admin approval? Assuming already created.
            ]);
        }

        // กรณี money ให้คิดเรทเงินประมาณ 80% ของราคาขายขวดต่อน้ำหนัก 1 กรัม 
        // 3 ประเภท: clear (ใส), opaque (ขุ่น), brown (สีชา)
        // รับค่า base_prices มาเป็น array: {"clear": 10, "opaque": 8, "brown": 5}
        if ($data['type'] === 'money' && isset($data['base_prices'])) {
            $this->pointrateModel->deleteByMachineId($id);
            foreach ($data['base_prices'] as $key => $price) {
                // เก็บ 80% ของราคา
                $rateValue = floatval($price) * 0.8;
                $this->pointrateModel->Create([
                    'm_id' => $id,
                    'key' => $key,
                    'value' => $rateValue
                ]);
            }
        } elseif ($data['type'] === 'point' && isset($data['rates'])) {
            $this->pointrateModel->deleteByMachineId($id);
            foreach ($data['rates'] as $key => $value) {
                $this->pointrateModel->Create([
                    'm_id' => $id,
                    'key' => $key,
                    'value' => floatval($value)
                ]);
            }
        }

        $this->jsonResponse(['status' => 'success', 'message' => 'อัปเดตการตั้งค่าสำเร็จ'], 200);
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
}

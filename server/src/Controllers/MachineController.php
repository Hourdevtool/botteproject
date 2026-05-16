<?php

namespace App\Controllers;

use App\Models\machine\machine;
use App\Models\user\User;

class MachineController extends BaseController
{
    protected $machine;



    public function __construct()
    {
        $this->machine = new machine();
    }


    public function getMachineByUser($id)
    {
        $userModel = new User();
        $user = $userModel->findById($id);

        if ($user) {
            $machine = $this->machine->getMachineByuserID($id);

            if ($machine) {
                $this->jsonResponse([
                    'status' => 'success',
                    'data' => $machine
                ], 200);
            } else {
                $this->jsonResponse([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลเครื่องจักร'
                ], 404);
            }
        } else {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'ไม่พบผู้ใช้'
            ], 404);
        }
    }


    public function addMachine()
    {
        $data = $this->getJsonInput();
        $this->checkEmpty($data, ['name', 'location', 'op_id']);
        
        $machine = $this->machine->Create($data);
        if ($machine) {
            $this->jsonResponse([
                'status' => 'success',
                'message' => 'เพิ่มข้อมูลสำเร็จ'
            ], 200);
        } else {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล'
            ], 500);
        }
    }

}

?>
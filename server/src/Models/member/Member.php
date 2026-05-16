<?php

namespace App\Models\member;
use App\Models\Basemodel;

class Member extends Basemodel{
    protected $table = 'tb_member';
    protected $primarykey = 'id';

    public function getByPhoneAndMachine($phone, $m_id){
        $sql = "SELECT * FROM {$this->table} WHERE phonenumber = :phone AND m_id = :m_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":m_id", $m_id);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}

<?php

namespace App\Models\machine;
use App\Models\Basemodel;

class Config extends Basemodel{
    protected $table = 'tb_config';
    protected $primarykey = 'id';

    public function getByMachineId($m_id){
        $sql = "SELECT * FROM {$this->table} WHERE m_id = :m_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":m_id", $m_id);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}

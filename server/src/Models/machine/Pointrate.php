<?php

namespace App\Models\machine;
use App\Models\Basemodel;

class Pointrate extends Basemodel{
    protected $table = 'tb_pointrate';
    protected $primarykey = 'id';

    public function getByMachineId($m_id){
        $sql = "SELECT * FROM {$this->table} WHERE m_id = :m_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":m_id", $m_id);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    public function deleteByMachineId($m_id){
        $sql = "DELETE FROM {$this->table} WHERE m_id = :m_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":m_id", $m_id);
        $stmt->execute();
        return $stmt->rowCount();
    }
}

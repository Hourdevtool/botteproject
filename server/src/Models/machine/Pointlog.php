<?php

namespace App\Models\machine;
use App\Models\Basemodel;

class Pointlog extends Basemodel{
    protected $table = 'tb_pointlog';
    protected $primarykey = 'id';

    public function getByUserId($u_id) {
        $sql = "SELECT * FROM {$this->table} WHERE u_id = :u_id ORDER BY createat DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':u_id', $u_id, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}

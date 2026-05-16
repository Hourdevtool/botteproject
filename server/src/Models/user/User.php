<?php

namespace App\Models\user;
use App\Models\Basemodel;


class User extends Basemodel{
    protected $table = 'tb_user';
    protected $primarykey = 'id';


    public function getByEmail($email){

        $sql =  "SELECT id, email, password, permission, op_name, role FROM {$this->table} WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":email",$email);
        $stmt->execute();
        return $stmt->fetch();
    }
}


?>
<?php

namespace App\Models\machine;

use App\Models\Basemodel;

class RedeemRequest extends Basemodel
{
    protected $table = 'tb_redeem_request';
    protected $primarykey = 'id';

    /**
     * ดึงรายการ pending ของตู้นั้น พร้อมข้อมูล member
     */
    public function getPendingByMachineId($m_id): array
    {
        $sql = "SELECT 
                    r.id,
                    r.u_id,
                    r.m_id,
                    r.amount,
                    r.status,
                    r.createat,
                    m.fname,
                    m.lname,
                    m.phonenumber
                FROM {$this->table} r
                LEFT JOIN tb_member m ON r.u_id = m.id
                WHERE r.m_id = :m_id AND r.status = 'pending'
                ORDER BY r.createat ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':m_id', $m_id, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * นับจำนวน pending request ของตู้
     */
    public function countPendingByMachineId($m_id): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE m_id = :m_id AND status = 'pending'";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':m_id', $m_id, \PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }

    /**
     * อัปเดตสถานะของ request
     */
    public function updateStatus($id, string $status): bool
    {
        $sql = "UPDATE {$this->table} SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id, \PDO::PARAM_INT);
        return $stmt->execute();
    }
}

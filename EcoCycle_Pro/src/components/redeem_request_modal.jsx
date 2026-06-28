import React, { useState } from 'react';
import { toast } from 'sonner';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../context/AuthContext';
import '../css/redeem_request_modal.css';

/**
 * RedeemRequestModal
 * หน้าต่างแสดงรายการคำขอแลกแต้ม/เงิน สำหรับเจ้าของตู้
 *
 * Props:
 *  - open: boolean
 *  - machineName: string
 *  - machineType: 'point' | 'money'
 *  - requests: Array<{ id, u_id, fname, lname, phonenumber, amount, createat }>
 *  - onClose: () => void
 *  - onActionDone: () => void  — callback หลัง approve/reject เพื่อ refresh
 *  - token: string
 */
const RedeemRequestModal = ({
  open,
  machineName = 'ตู้',
  machineType = 'point',
  requests = [],
  onClose,
  onActionDone,
  token,
}) => {
  const [loadingId, setLoadingId] = useState(null);
  const authToken = token || getAuthToken();
  const unit = machineType === 'money' ? 'บาท' : 'แต้ม';
  const label = machineType === 'money' ? 'เงิน' : 'แต้ม';

  if (!open) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (fname = '', lname = '') => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase() || '?';
  };

  const handleApprove = async (requestId) => {
    setLoadingId(`approve-${requestId}`);
    try {
      const response = await fetch(apiUrl(`/api/operator/redeem-requests/${requestId}/approve`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        toast.success(`อนุมัติสำเร็จ — ตัดออก ${data.data?.redeemed_amount ?? ''} ${unit}`, {
          description: `คงเหลือ: ${data.data?.remaining_point ?? ''} ${unit}`,
          duration: 4000,
        });
        onActionDone?.();
      } else {
        toast.error(data.message || 'ไม่สามารถอนุมัติได้', { duration: 4000 });
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { duration: 4000 });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setLoadingId(`reject-${requestId}`);
    try {
      const response = await fetch(apiUrl(`/api/operator/redeem-requests/${requestId}/reject`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        toast.info('ยกเลิกคำขอแลกแล้ว', { duration: 4000 });
        onActionDone?.();
      } else {
        toast.error(data.message || 'ไม่สามารถยกเลิกได้', { duration: 4000 });
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { duration: 4000 });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rrm-backdrop" onClick={onClose} role="presentation">
      <div
        className="rrm-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`คำขอแลก${label} — ${machineName}`}
      >
        {/* ── Header ── */}
        <div className="rrm-header">
          <div className="rrm-header-left">
            <div className="rrm-header-icon">
              {/* Bell icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h2>คำขอแลก{label}</h2>
              <p>{machineName} · {requests.length} รายการรอดำเนินการ</p>
            </div>
          </div>
          <button
            type="button"
            className="rrm-close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="rrm-body">
          {requests.length === 0 ? (
            <div className="rrm-empty">
              <div className="rrm-empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h3>ไม่มีคำขอรอดำเนินการ</h3>
              <p>เมื่อมีสมาชิกส่งคำขอแลก{label} จะแสดงที่นี่</p>
            </div>
          ) : (
            requests.map((req) => {
              const isApprovingThis = loadingId === `approve-${req.id}`;
              const isRejectingThis = loadingId === `reject-${req.id}`;
              const isAnyLoading = !!loadingId;

              return (
                <div key={req.id} className="rrm-item">
                  {/* ── Left: member info ── */}
                  <div className="rrm-member-info">
                    <div className="rrm-avatar" aria-hidden="true">
                      {getInitials(req.fname, req.lname)}
                    </div>
                    <div className="rrm-member-details">
                      <p className="rrm-member-name">
                        {req.fname} {req.lname}
                      </p>
                      <p className="rrm-member-phone">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.14h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {req.phonenumber || '—'}
                      </p>
                      <span className="rrm-member-time">{formatDate(req.createat)}</span>
                    </div>
                  </div>

                  {/* ── Right: amount + actions ── */}
                  <div className="rrm-right">
                    <div className="rrm-amount-badge">
                      <span className="rrm-amount-label">ขอแลก</span>
                      <span className="rrm-amount-value">
                        {parseFloat(req.amount).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="rrm-amount-unit">{unit}</span>
                    </div>

                    <div className="rrm-actions">
                      <button
                        type="button"
                        className="rrm-btn rrm-btn-reject"
                        onClick={() => handleReject(req.id)}
                        disabled={isAnyLoading}
                        aria-label={`ยกเลิกคำขอของ ${req.fname} ${req.lname}`}
                      >
                        {isRejectingThis ? (
                          <span className="rrm-spinner" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                        ยกเลิก
                      </button>

                      <button
                        type="button"
                        className="rrm-btn rrm-btn-approve"
                        onClick={() => handleApprove(req.id)}
                        disabled={isAnyLoading}
                        aria-label={`ยืนยันคำขอของ ${req.fname} ${req.lname}`}
                      >
                        {isApprovingThis ? (
                          <span className="rrm-spinner" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RedeemRequestModal;

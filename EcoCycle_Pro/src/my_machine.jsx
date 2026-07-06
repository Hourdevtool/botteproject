import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/sidebar';
import NotificationModal from './components/notification_modal';
import RedeemRequestModal from './components/redeem_request_modal';
import './css/my_machine.css';
import { apiUrl } from './lib/api';
import { getAuthToken, useAuth } from './context/AuthContext';

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'pending';
  if (value.includes('pending') || value.includes('รอ')) return 'pending';
  if (value.includes('online') || value.includes('ออนไลน์') || value.includes('อนุมัติการใช้งานแล้ว')) return 'approved';
  if (value.includes('ไม่อนุมัติ') || value.includes('ยกเลิก') || value.includes('cancelled') || value.includes('cancel')) return 'cancelled';
  return 'pending';
};

const formatStatusLabel = (status, isFull = false) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'cancelled') {
    return 'ไม่อนุมัติการใช้งาน';
  }

  if (normalized === 'pending') {
    return 'รออนุมัติ';
  }

  if (normalized === 'approved') {
    return isFull ? 'ตู้เต็ม' : 'อนุมัติการใช้งานแล้ว';
  }
};

const getStatusTone = (status) => normalizeStatus(status);

const getStatusColor = (status, isFull = false) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'pending') {
    return 'status-pending';
  }

  if (normalized === 'approved') {
    return isFull ? 'status-full' : 'status-approved';
  }

  if (normalized === 'cancelled') {
    return 'status-cancelled';
  }

  return 'status-pending';
};

const calculateCapacity = (count) => {
  const current = Number(count || 0);
  return Math.min(100, Math.round((current / 1000) * 100));
};

const isMachineFull = (count) => {
  const current = Number(count || 0);
  return current >= 1000 || current >= 900;
};

const MyMachine = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.token || getAuthToken();
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  // redeemRequests: { [machineId]: { total_pending, requests[], machineType } }
  const [redeemRequests, setRedeemRequests] = useState({});
  // redeemModal: { open, machineId, machineName, machineType }
  const [redeemModal, setRedeemModal] = useState({ open: false, machineId: null, machineName: '', machineType: 'point' });
  const pollingRef = useRef(null);
  const [notification, setNotification] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'info',
    confirmLabel: 'ตกลง',
    cancelLabel: 'ยกเลิก',
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const openNotification = (title, description, variant = 'info') => {
    setNotification({
      open: true,
      title,
      description,
      variant,
      confirmLabel: 'ตกลง',
    });
  };

  const fetchMachines = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/machine/${currentUser.id}`), {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (response.ok && payload.status === 'success' && Array.isArray(payload.data)) {
        setMachines(payload.data);
      } else {
        setMachines([]);
        openNotification('ไม่สามารถโหลดข้อมูลได้', payload.message || 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้');
      }
    } catch (error) {
      console.error(error);
      setMachines([]);
      openNotification('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, token]);

  useEffect(() => {
    fetchMachines();
  }, [currentUser]);

  // ── Fetch redeem requests สำหรับตู้ที่ approved ทั้งหมด ──
  const fetchRedeemRequests = useCallback(async (machineList) => {
    if (!machineList || machineList.length === 0) return;
    const approvedMachines = machineList.filter((m) => normalizeStatus(m.status) === 'approved');
    if (approvedMachines.length === 0) return;

    const results = await Promise.allSettled(
      approvedMachines.map(async (machine) => {
        try {
          const res = await fetch(apiUrl(`/api/operator/machines/${machine.id}/redeem-requests`), {
            headers: { 'Authorization': `Bearer ${token || ''}` },
          });
          const data = await res.json();
          if (res.ok && data.status === 'success') {
            // หา machineType จาก machine
            return {
              machineId: machine.id,
              total_pending: data.data.total_pending,
              requests: data.data.requests,
            };
          }
        } catch {
          // ไม่แสดง error สำหรับ polling
        }
        return { machineId: machine.id, total_pending: 0, requests: [] };
      })
    );

    setRedeemRequests((prev) => {
      const next = { ...prev };
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          next[r.value.machineId] = {
            total_pending: r.value.total_pending,
            requests: r.value.requests,
          };
        }
      });
      return next;
    });
  }, [token]);

  // เมื่อ machines เปลี่ยน fetch redeem requests ทันที + ตั้ง polling
  useEffect(() => {
    fetchRedeemRequests(machines);

    // Clear polling เก่า
    if (pollingRef.current) clearInterval(pollingRef.current);

    // ตั้ง polling ทุก 30 วินาที
    pollingRef.current = setInterval(() => {
      fetchRedeemRequests(machines);
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [machines, fetchRedeemRequests]);

  const stats = useMemo(() => {
    const totalMachines = machines.length;
    const totalBottles = machines.reduce((sum, machine) => sum + Number(machine.count || 0), 0);
    const pendingMachines = machines.filter((machine) => normalizeStatus(machine.status) === 'pending').length;

    return { totalMachines, totalBottles, pendingMachines };
  }, [machines]);

  const filteredMachines = useMemo(() => {
    if (statusFilter === 'all') return machines;
    return machines.filter((machine) => normalizeStatus(machine.status) === statusFilter);
  }, [machines, statusFilter]);

  const filterLabel = {
    all: 'ทั้งหมด',
    approved: 'อนุมัติแล้ว',
    pending: 'รออนุมัติ',
    cancelled: 'ไม่อนุมัติการใช้งาน',
  }[statusFilter] || 'ทั้งหมด';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      openNotification('กรุณาเข้าสู่ระบบใหม่', 'กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อเพิ่มตู้');
      return;
    }

    const name = formData.name.trim();
    const location = formData.location.trim();

    if (!name || !location) {
      openNotification('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อตู้และสถานที่ก่อนบันทึก');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(apiUrl('/api/machine'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          name,
          location,
          op_id: currentUser.id,
          status: 'รออนุมัติ',
          count: 0,
        }),
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.message || 'ไม่สามารถเพิ่มตู้ได้');
      }

      setFormData({ name: '', location: '' });
      setIsModalOpen(false);
      openNotification(
        'เพิ่มตู้สำเร็จ',
        'ระบบจะแสดงสถานะ "รออนุมัติ" จนกว่าผู้ดูแลจะอนุมัติ'
      );
      await fetchMachines();
    } catch (error) {
      openNotification('เกิดข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRedeemModal = (machine) => {
    setRedeemModal({
      open: true,
      machineId: machine.id,
      machineName: machine.name,
      machineType: machine.config_type || 'point',
    });
  };

  const closeRedeemModal = () => {
    setRedeemModal((prev) => ({ ...prev, open: false }));
  };

  const handleRedeemActionDone = async () => {
    // refresh requests สำหรับตู้นั้น
    await fetchRedeemRequests(machines);
    // ถ้า modal เปิดอยู่ ให้ re-fetch requests ของตู้นั้นเพื่ออัปเดตรายการ
    if (redeemModal.machineId) {
      try {
        const res = await fetch(apiUrl(`/api/operator/machines/${redeemModal.machineId}/redeem-requests`), {
          headers: { 'Authorization': `Bearer ${token || ''}` },
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setRedeemRequests((prev) => ({
            ...prev,
            [redeemModal.machineId]: {
              total_pending: data.data.total_pending,
              requests: data.data.requests,
            },
          }));
        }
      } catch {
        // silent
      }
    }
  };

  const openModal = () => setIsModalOpen(true);

  const filterLabelMap = {
    all: 'ทั้งหมด',
    approved: 'อนุมัติแล้ว',
    pending: 'รออนุมัติ',
    cancelled: 'ไม่อนุมัติการใช้งาน',
  };

  const handleManageMachine = (machineId, statusTone) => {
    if (statusTone === 'pending' || statusTone === 'offline') {
      return;
    }
    navigate(`/machine_config/${machineId}`);
  };

  const handleDeleteMachine = (machineId) => {
    setNotification({
      open: true,
      title: 'ยืนยันการลบตู้',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบตู้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      variant: 'confirm',
      confirmLabel: 'ลบตู้',
      cancelLabel: 'ยกเลิก',
      onConfirm: async () => {
        closeNotification();
        try {
          const response = await fetch(apiUrl(`/api/machine/${machineId}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token || ''}`,
            },
          });

          const payload = await response.json().catch(() => null);

          if (response.ok && payload?.status === 'success') {
            openNotification('ลบตู้สำเร็จ', 'ระบบได้ลบข้อมูลตู้ออกจากระบบแล้ว');
            await fetchMachines();
          } else {
            openNotification('เกิดข้อผิดพลาด', payload?.message || 'ไม่สามารถลบตู้ได้');
          }
        } catch (error) {
          openNotification('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
      },
      onCancel: closeNotification,
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', location: '' });
  };

  return (
    <div className="my-machine-app-container">
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ style: { fontFamily: "'Inter', 'Prompt', sans-serif" } }}
      />
      <Sidebar />
      <main className="mm-main-content">
        <div className="mm-hero-panel">
          <div>
            <p className="mm-eyebrow">EcoCycle Pro</p>
            <h1 className="mm-page-title">ตู้ของฉัน</h1>
            <p className="mm-page-subtitle">เพิ่ม ติดตาม และดูสถานะตู้รีไซเคิลของคุณได้จากหน้าเดียว</p>
          </div>
          <div className="mm-hero-actions">
            <div className="mm-filter-wrapper">
              <button
                className="mm-btn-filter"
                type="button"
                onClick={() => setShowFilterMenu((prev) => !prev)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></svg>
                ตัวกรอง
                <span className="mm-filter-chip">{filterLabel}</span>
              </button>

              {showFilterMenu ? (
                <div className="mm-filter-menu" role="menu" aria-label="ตัวกรองสถานะตู้">
                  {Object.entries(filterLabelMap).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`mm-filter-option ${statusFilter === value ? 'active' : ''}`}
                      onClick={() => {
                        setStatusFilter(value);
                        setShowFilterMenu(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button className="mm-btn-add-machine" type="button" onClick={openModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
              เพิ่มตู้ใหม่
            </button>
          </div>
        </div>

        <NotificationModal
          open={notification.open}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
          confirmLabel={notification.confirmLabel}
          cancelLabel={notification.cancelLabel || 'ยกเลิก'}
          onConfirm={notification.onConfirm || closeNotification}
          onCancel={notification.onCancel || closeNotification}
        />

        <div className="mm-stats-row">
          <div className="mm-stat-card">
            <div className="mm-stat-icon-wrapper mm-bg-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14v4M18 14v4M3 18h18M12 14v-6M10 8h4M12 4v4" /><circle cx="12" cy="4" r="2" /></svg>
            </div>
            <div className="mm-stat-info">
              <span className="mm-stat-label">จำนวนตู้ทั้งหมด</span>
              <span className="mm-stat-value">{stats.totalMachines}</span>
            </div>
          </div>

          <div className="mm-stat-card">
            <div className="mm-stat-icon-wrapper mm-text-green">
              <span className="mm-recycle-badge">RE<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15.3l-3 3-3-3" /><path d="M4 18.3V12a8 8 0 0 1 12.3-6.8" /><path d="M17 8.7l3-3 3 3" /><path d="M20 5.7V12a8 8 0 0 1-12.3 6.8" /></svg></span>
            </div>
            <div className="mm-stat-info">
              <span className="mm-stat-label">จำนวนขวดปัจจุบัน</span>
              <span className="mm-stat-value">{stats.totalBottles.toLocaleString('th-TH')}</span>
            </div>
          </div>

          <div className="mm-stat-card">
            <div className="mm-stat-icon-wrapper mm-bg-red">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
            </div>
            <div className="mm-stat-info">
              <span className="mm-stat-label">รออนุมัติ</span>
              <span className="mm-stat-value">{stats.pendingMachines}</span>
            </div>
          </div>
        </div>

        <div className="mm-machines-grid">
          {isLoading ? (
            <>
              {[1, 2].map((item) => (
                <div className="mm-machine-card mm-skeleton-card" key={item}>
                  <div className="mm-skeleton-image" />
                  <div className="mm-machine-content">
                    <div className="mm-skeleton-line wide" />
                    <div className="mm-skeleton-line short" />
                    <div className="mm-skeleton-line" />
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {!isLoading && filteredMachines.length === 0 ? (
            <div className="mm-empty-state">
              <div className="mm-empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z" /><path d="M14 12h4" /><path d="M18 9v6a2 2 0 0 0 2 2h2" /></svg>
              </div>
              <h3>ยังไม่มีตู้ในระบบของคุณ</h3>
              <p>เริ่มต้นด้วยการเพิ่มตู้ใหม่เพื่อให้สามารถติดตามสถานะการใช้งานและการอนุมัติได้ทันที</p>
              <button className="mm-btn-setup" type="button" onClick={openModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                เพิ่มตู้ใหม่
              </button>
            </div>
          ) : null}

          {!isLoading && filteredMachines.map((machine) => {
            const statusTone = getStatusTone(machine.status);
            const capacity = calculateCapacity(machine.count);
            const full = isMachineFull(machine.count);
            const isPending = statusTone === 'pending';
            const isCancelled = statusTone === 'cancelled';
            const isApproved = statusTone === 'approved';
            const statusColor = getStatusColor(machine.status, full);
            const progressClass = full ? 'mm-bg-red-main' : (capacity >= 80 ? 'mm-bg-orange' : 'mm-bg-green-main');
            const pendingCount = redeemRequests[machine.id]?.total_pending ?? 0;
            const hasPending = pendingCount > 0;

            return (
              <article
                className={`mm-machine-card ${isPending ? 'mm-machine-card-pending' : ''} ${isCancelled ? 'mm-machine-card-cancelled' : ''} ${full && isApproved ? 'mm-machine-card-full' : ''} ${statusColor}`}
                key={machine.id}
              >
                <div className={`mm-machine-image ${isPending ? 'mm-image-pending' : ''} ${isCancelled ? 'mm-image-cancelled' : ''} ${full && isApproved ? 'mm-image-full' : ''}`}>
                  <div className="mm-hero-overlay">
                    <div className={`mm-badge ${isApproved ? 'mm-badge-online' : isCancelled ? 'mm-badge-cancelled' : 'mm-badge-pending'} ${full && isApproved ? 'mm-badge-full' : ''}`}>
                      <span className="mm-dot" />
                      {formatStatusLabel(machine.status, full)}
                    </div>

                    {isApproved && (
                      <button
                        type="button"
                        className={`mm-bell-btn ${hasPending ? 'mm-bell-active' : ''}`}
                        onClick={() => openRedeemModal(machine)}
                        aria-label={hasPending ? `ดูคำขอแลก ${pendingCount} รายการ` : 'ไม่มีคำขอแลกรอดำเนินการ'}
                        title={hasPending ? `มีคำขอแลก ${pendingCount} รายการรอดำเนินการ` : 'ไม่มีคำขอแลกรอดำเนินการ'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {hasPending && (
                          <span className="mm-bell-count" aria-label={`${pendingCount} รายการรอดำเนินการ`}>
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="mm-hero-glow" />
                </div>

                <div className="mm-machine-content">
                  <div className="mm-card-title-row">
                    <div>
                      <p className="mm-card-kicker">
                        {isPending ? 'กำลังรออนุมัติ' : isCancelled ? 'ยกเลิกแล้ว' : full && isApproved ? 'ตู้เต็ม' : 'เครื่องพร้อมใช้งาน'}
                      </p>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {machine.name}
                        {isApproved && <span className="mm-machine-id" style={{ fontSize: '0.75rem', fontWeight: '500', padding: '2px 6px', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px' }}>#{machine.id}</span>}
                      </h3>
                    </div>
                    <span className={`mm-status-pill ${statusTone} ${isCancelled ? 'status-cancelled' : ''} ${full && isApproved ? 'status-full' : ''}`}>{formatStatusLabel(machine.status, full)}</span>
                  </div>

                  <p className="mm-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                    {machine.location || 'ยังไม่ได้ระบุสถานที่'}
                  </p>

                  <div className="mm-capacity-section">
                    <div className="mm-capacity-header">
                      <span>ความจุ</span>
                      <span className="mm-capacity-percent">{capacity}% {full ? '(เต็ม)' : ''}</span>
                    </div>
                    <div className="mm-progress-bar">
                      <div className={`mm-progress-fill ${progressClass}`} style={{ width: `${capacity}%` }} />
                    </div>
                  </div>

                  <div className="mm-bottles-section">
                    <span>จำนวนขวดปัจจุบัน</span>
                    <span className="mm-bottles-count">{Number(machine.count || 0).toLocaleString('th-TH')} / 1000</span>
                  </div>

                  <div className="mm-meta-row">
                    <span>สร้างเมื่อ {machine.createat ? new Date(machine.createat).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                    <span>
                      {isPending ? 'ยังไม่เปิดใช้งาน' : isCancelled ? 'การอนุมัติถูกยกเลิก' : full ? 'ตู้เต็ม - หยุดรับขวด' : 'พร้อมรับขวด'}
                    </span>
                  </div>
                </div>

                <div className={`mm-machine-footer ${isCancelled ? 'mm-footer-cancelled' : full && isApproved ? 'mm-footer-full' : 'mm-bg-light-green'}`}>
                  <span>
                    {isPending ? 'รอการอนุมัติจากผู้ดูแลระบบ' : isCancelled ? 'ยกเลิกการอนุมัติแล้ว' : full ? 'ตู้เต็มและหยุดรับขวดชั่วคราว' : 'สามารถตั้งค่าตู้ได้แล้ว'}
                  </span>
                  {isCancelled ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteMachine(machine.id)}
                      aria-label={`ลบตู้ ${machine.name}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#E53E3E',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      ลบตู้
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleManageMachine(machine.id, statusTone)}
                      disabled={isPending}
                      aria-label={isPending ? 'ไม่สามารถตั้งค่าตู้ขณะนี้' : `ตั้งค่าตู้ ${machine.name}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'transparent',
                        border: 'none',
                        color: isPending ? '#94A3B8' : '#1A4D2E',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      ตั้งค่าตู้
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {isModalOpen ? (
          <div className="mm-modal-backdrop" onClick={closeModal}>
            <div className="mm-modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="mm-modal-header">
                <div>
                  <p className="mm-eyebrow">เพิ่มตู้ใหม่</p>
                  <h2>กรอกข้อมูลตู้เพื่อบันทึกลงฐานข้อมูล</h2>
                </div>
                <button className="mm-modal-close" type="button" onClick={closeModal} aria-label="ปิดหน้าต่างเพิ่มตู้">
                  ×
                </button>
              </div>

              <form className="mm-modal-form" onSubmit={handleSubmit}>
                <label className="mm-form-field">
                  <span>ชื่อตู้</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="เช่น Central Plaza Unit A"
                  />
                </label>

                <label className="mm-form-field">
                  <span>สถานที่ตั้ง</span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="เช่น ชั้น 1 ใกล้ประตูทิศเหนือ"
                  />
                </label>

                <div className="mm-modal-actions">
                  <button className="mm-btn-filter" type="button" onClick={closeModal}>
                    ยกเลิก
                  </button>
                  <button className="mm-btn-add-machine" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกตู้ใหม่'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* ── RedeemRequest Modal ── */}
        <RedeemRequestModal
          open={redeemModal.open}
          machineName={redeemModal.machineName}
          machineType={redeemModal.machineType}
          requests={redeemRequests[redeemModal.machineId]?.requests ?? []}
          onClose={closeRedeemModal}
          onActionDone={handleRedeemActionDone}
          token={token}
        />
      </main>
    </div>
  );
};

export default MyMachine;
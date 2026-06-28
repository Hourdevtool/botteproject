import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/sidebar';
import NotificationModal from './components/notification_modal';
import './css/analytics.css';
import { apiUrl } from './lib/api';
import { getAuthToken, useAuth } from './context/AuthContext';

const STATUS = {
  PENDING: 'pending',
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  REJECTED: 'rejected',
};

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return STATUS.PENDING;
  if (value.includes('pending') || value.includes('รอ')) return STATUS.PENDING;
  if (value.includes('ออนไลน์') || value.includes('online') || value.includes('อนุมัติการใช้งานแล้ว')) return STATUS.ONLINE;
  if (value.includes('offline') || value.includes('ระงับ') || value.includes('suspend')) return STATUS.OFFLINE;
  if (value.includes('maintenance') || value.includes('ซ่อม') || value.includes('ตรวจสอบ')) return STATUS.MAINTENANCE;
  if (value.includes('ไม่อนุมัติ') || value.includes('ยกเลิก') || value.includes('cancel')) return STATUS.REJECTED;
  return STATUS.PENDING;
};

const getStatusLabel = (status) => {
  switch (normalizeStatus(status)) {
    case STATUS.ONLINE:
      return 'อนุมัติการใช้งานแล้ว';
    case STATUS.REJECTED:
      return 'ไม่อนุมัติการใช้งาน';
    default:
      return 'รออนุมัติ';
  }
};

const getStatusTone = (status) => normalizeStatus(status);

const getCapacityValue = (count) => Math.min(100, Math.round((Number(count || 0) / 1000) * 100));

const getCapacityColor = (capacity) => {
  if (capacity >= 100) return 'red';
  if (capacity >= 80) return 'orange';
  return 'green';
};

const Analytics = () => {
  const { session } = useAuth();
  const token = session?.token || getAuthToken();
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [processingMachineId, setProcessingMachineId] = useState(null);
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'info',
    confirmLabel: 'ตกลง',
    cancelLabel: 'ยกเลิก',
    onConfirm: null,
    onCancel: null,
    isLoading: false,
  });

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, open: false, isLoading: false, onConfirm: null, onCancel: null }));
  };

  const openNotification = (title, description, variant = 'info', confirmLabel = 'ตกลง') => {
    setDialog({
      open: true,
      title,
      description,
      variant,
      confirmLabel,
      cancelLabel: 'ยกเลิก',
      onConfirm: closeDialog,
      onCancel: closeDialog,
      isLoading: false,
    });
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(apiUrl('/api/user/me'), {
        headers: { 
          Accept: 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.status === 'success' && payload.data) {
        setCurrentUserRole(payload.data.role === 'admin' ? 'admin' : 'operator');
        return;
      }
    } catch {
      // ignore and fall back below
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUserRole(parsed.role === 'admin' ? 'admin' : 'operator');
        return;
      } catch {
        // ignore
      }
    }

    setCurrentUserRole('operator');
  };

  const fetchMachines = async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/admin/machines'), {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (response.ok && payload?.status === 'success' && Array.isArray(payload.data)) {
        if (isPolling) {
          // แก้ไขจุดสำคัญ: คงค่าสถานะ Local State (เช่น isSuspendedByAdmin) ที่เคยกดไว้ ไม่ให้โดนข้อมูลใหม่เขียนทับ
          setMachines((prevMachines) => {
            return payload.data.map((newMachine) => {
              const matchedPrev = prevMachines.find((p) => p.id === newMachine.id);
              return {
                ...newMachine,
                isSuspendedByAdmin: matchedPrev ? matchedPrev.isSuspendedByAdmin : false,
              };
            });
          });
        } else {
          setMachines(payload.data);
        }
      } else if (!isPolling) {
        setMachines([]);
        openNotification('ไม่สามารถโหลดข้อมูลเครื่องจักร', payload?.message || 'ไม่สามารถโหลดข้อมูลเครื่องจักรได้', 'error');
      }
    } catch {
      if (!isPolling) {
        setMachines([]);
        openNotification('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
      }
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchMachines();

    const intervalId = setInterval(() => {
      fetchMachines(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const filteredMachines = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return machines;

    return machines.filter((machine) => {
      const haystack = [machine.id, machine.location, machine.op_name, machine.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [machines, searchTerm]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMachines.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, machines.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedMachines = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMachines.slice(start, start + PAGE_SIZE);
  }, [filteredMachines, currentPage]);

  const startEntry = filteredMachines.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE, filteredMachines.length);

  const stats = useMemo(() => {
    const totalMachines = machines.length;
    const totalBottles = machines.reduce((sum, machine) => sum + Number(machine.count || 0), 0);
    const pendingMachines = machines.filter((machine) => getStatusTone(machine.status) === 'pending').length;
    const activeMachines = machines.filter((machine) => getStatusTone(machine.status) === 'online').length;

    return { totalMachines, totalBottles, pendingMachines, activeMachines };
  }, [machines]);

  const getActionLabel = (action) => {
    if (action === 'approve') return 'อนุมัติ';
    if (action === 'reject') return 'ไม่อนุมัติ';
    return 'ยกเลิกอนุมัติ';
  };

  const getSuccessMessage = (action) => {
    if (action === 'approve') return 'อนุมัติเครื่องแล้ว เครื่องพร้อมใช้งาน';
    return 'เปลี่ยนสถานะเป็นระงับการใช้งานแล้ว';
  };

  const requestMachineAction = (machine, action) => {
    if (currentUserRole !== 'admin') {
      openNotification(
        'สิทธิ์การใช้งานไม่เพียงพอ',
        'คุณมีสิทธิ์ดูข้อมูลเท่านั้น สำหรับการเปลี่ยนสถานะต้องใช้บัญชีผู้ดูแลระบบ'
      );
      return;
    }

    const actionLabel = getActionLabel(action);
    setDialog({
      open: true,
      title: `ยืนยันการ${actionLabel}`,
      description: `คุณต้องการ ${actionLabel} ตู้ชื่อ ${machine.name || machine.id} ใช่หรือไม่?`,
      variant: action === 'suspend' ? 'danger' : 'confirm',
      confirmLabel: actionLabel,
      cancelLabel: 'ยกเลิก',
      onConfirm: () => performMachineAction(machine, action),
      onCancel: closeDialog,
      isLoading: false,
    });
  };

  const performMachineAction = async (machine, action) => {
    setDialog((prev) => ({ ...prev, isLoading: true }));
    setProcessingMachineId(machine.id);

    try {
      const endpoint = action === 'approve' || action === 'reject' || action === 'suspend'
        ? `/api/admin/machines/${machine.id}/approve`
        : `/api/admin/machines/${machine.id}/status`;

      let body = {};
      if (action === 'approve') {
        body = { allow: 1 };
      } else if (action === 'reject' || action === 'suspend') {
        body = { allow: 0 };
      } else {
        body = { status: 'ระงับการใช้งาน' };
      }

      const response = await fetch(apiUrl(endpoint), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (!response.ok || payload?.status !== 'success') {
        throw new Error(payload?.message || 'ไม่สามารถเปลี่ยนสถานะได้');
      }

      setMachines((prev) =>
        prev.map((item) => {
          if (item.id === machine.id) {
            const isSuspendAction = action === 'suspend';
            const isApproveAction = action === 'approve';
            
            return {
              ...item,
              status: isApproveAction ? 'อนุมัติการใช้งานแล้ว' : 'ไม่อนุมัติการใช้งาน',
              allow: isApproveAction ? 1 : 0,
              isSuspendedByAdmin: isSuspendAction,
            };
          }
          return item;
        })
      );

      openNotification('สำเร็จ', getSuccessMessage(action));
    } catch (error) {
      openNotification('เกิดข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setProcessingMachineId(null);
      closeDialog(); // แก้ไข: ปิดหน้าต่างตกลงเมื่อทำรายการสำเร็จ
    }
  };
  
  const getActionConfig = (machine) => {
    const status = getStatusTone(machine.status);
    const isSuspended = machine.isSuspendedByAdmin === true;

    // แก้ไขเงื่อนไข: ตรวจสอบสถานะและส่งปุ่มออกไปให้ครอบคลุม ไม่ให้ส่งค่า null เปล่าๆ ออกไปจนกลายเป็นเครื่องหมาย "-"
    if (status === STATUS.PENDING) {
      return {
        primaryLabel: 'อนุมัติ',
        primaryType: 'primary',
        secondaryLabel: 'ไม่อนุมัติ',
        secondaryType: 'outline',
        primaryAction: 'approve',
        secondaryAction: 'reject',
      };
    }
    
    if (status === STATUS.OFFLINE || status === STATUS.REJECTED || isSuspended) {
      return {
        primaryLabel: 'อนุมัติกลับมาใช้งาน',
        primaryType: 'primary',
        secondaryLabel: null,
        secondaryType: null,
        primaryAction: 'approve',
        secondaryAction: null,
      };
    }

    // สำหรับสถานะ ONLINE หรือสถานะปกติอื่นๆ ให้สามารถสั่ง "ยกเลิกอนุมัติ" (Suspend) ได้
    return {
      primaryLabel: 'ยกเลิกอนุมัติ',
      primaryType: 'danger',
      secondaryLabel: null,
      secondaryType: null,
      primaryAction: 'suspend',
      secondaryAction: null,
    };
  };

  return (
    <div className="analytics-app-container">
      <Sidebar />
      <main className="analytics-main-content">
        <div className="analytics-header">
          <div className="header-text">
            <h1>รายละเอียดเครื่องจักร</h1>
            <p>จัดการและตรวจสอบสถานะเครื่อง EcoCycle</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="ค้นหารหัสเครื่องหรือสถานที่"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button className="analytics-filter-btn" type="button" onClick={() => setSearchTerm('')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="8" x2="16" y1="12" y2="12"/><line x1="10" x2="14" y1="18" y2="18"/></svg>
              ล้างค้นหา
            </button>
          </div>
        </div>

        <NotificationModal
          open={dialog.open}
          title={dialog.title}
          description={dialog.description}
          variant={dialog.variant}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={dialog.onConfirm || closeDialog}
          onCancel={dialog.onCancel || closeDialog}
          isLoading={dialog.isLoading}
        />

        <div className="stats-cards-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <h4>เครื่องทั้งหมด</h4>
              <div className="stat-icon green-bg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"/><path d="M14 12h4"/><path d="M18 9v6a2 2 0 0 0 2 2h2"/></svg>
              </div>
            </div>
            <h2>{stats.totalMachines}</h2>
            <div className="stat-trend positive">
              <span>อัปเดตจากฐานข้อมูลล่าสุด</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <h4>เครื่องพร้อมใช้งาน</h4>
              <div className="stat-icon cyan-bg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <h2>{stats.activeMachines}</h2>
            <div className="stat-trend positive">
              <span>เครื่องที่ตอนนี้สามารถใช้งานได้</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <h4>ขวดที่รับคืนทั้งหมด</h4>
              <div className="stat-icon green-outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
            </div>
            <h2>{stats.totalBottles.toLocaleString('th-TH')}</h2>
            <div className="stat-trend positive">
              <span>ยอดรวมจากฐานข้อมูลทุกตู้</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <h4>รออนุมัติ</h4>
              <div className="stat-icon red-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
            </div>
            <h2>{stats.pendingMachines}</h2>
            <div className="stat-trend negative">
              <span>เครื่องใหม่ที่ต้องพิจารณาอนุมัติ</span>
            </div>
          </div>
        </div>

        <div className="machine-table-container">
          {isLoading ? (
            <div className="analytics-loading-state">
              <div className="analytics-loading-spinner" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : null}

          {!isLoading && filteredMachines.length === 0 ? (
            <div className="analytics-empty-state">
              <h3>ไม่พบข้อมูลเครื่องจักร</h3>
              <p>{searchTerm ? 'ลองค้นหาด้วยรหัสเครื่องหรือสถานที่อื่น' : 'ยังไม่มีข้อมูลตู้ในระบบ'}</p>
            </div>
          ) : null}

          {!isLoading && filteredMachines.length > 0 ? (
            <>
              <div className="analytics-table-wrapper">
                <table className="machine-table">
                  <thead>
                    <tr>
                      <th>ชื่อเครื่อง</th>
                      <th>สถานที่ตั้ง</th>
                      <th>เจ้าของตู้</th>
                      <th>จำนวนขวด<br />รวม</th>
                      <th>ความจุ</th>
                      <th>สถานะ</th>
                      <th>ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedMachines.map((machine) => {
                      const capacity = getCapacityValue(machine.count);
                      const capacityColor = getCapacityColor(capacity);
                      const statusTone = getStatusTone(machine.status);
                      const actionConfig = getActionConfig(machine);
                      const isBusy = processingMachineId === machine.id;

                      return (
                        <tr key={machine.id}>
                          <td>
                            <div className="id-col">
                              <div className={`id-icon ${statusTone === 'maintenance' ? 'red' : 'green'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"/><path d="M14 12h4"/><path d="M18 9v6a2 2 0 0 0 2 2h2"/></svg>
                              </div>
                              <div>
                                <strong>{machine.name || machine.id}</strong>
                                <div className="version-info">{machine.type || 'ประเภททั่วไป'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="location-text">{machine.location || 'ยังไม่ได้ระบุสถานที่'}</div>
                          </td>
                          <td>{machine.op_name || 'ยังไม่ระบุ'}</td>
                          <td>{Number(machine.count || 0).toLocaleString('th-TH')}</td>
                          <td>
                            <div className="capacity-wrapper">
                              <span className={`capacity-percent text-${capacityColor}`}>{capacity}%</span>
                              <div className="progress-bar-bg">
                                <div className={`progress-bar fill-${capacityColor}`} style={{ width: `${capacity}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${statusTone}`}>
                              <span className="analytics-dot"></span>
                              {getStatusLabel(machine.status)}
                            </span>
                          </td>
                          <td>
                            {currentUserRole !== 'admin' ? (
                              <span className="analytics-readonly-label">เฉพาะผู้ดูแลระบบ</span>
                            ) : (
                              <div className="analytics-action-group">
                                {actionConfig.primaryLabel ? (
                                  <button
                                    className={`action-btn ${actionConfig.primaryType}`}
                                    type="button"
                                    onClick={() => requestMachineAction(machine, actionConfig.primaryAction)}
                                    disabled={isBusy}
                                  >
                                    {isBusy ? 'กำลังอัปเดต...' : actionConfig.primaryLabel}
                                  </button>
                                ) : (
                                  <span className="analytics-readonly-label">-</span>
                                )}
                                {actionConfig.secondaryLabel ? (
                                  <button
                                    className={`action-btn ${actionConfig.secondaryType}`}
                                    type="button"
                                    onClick={() => requestMachineAction(machine, actionConfig.secondaryAction)}
                                    disabled={isBusy}
                                  >
                                    {actionConfig.secondaryLabel}
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="analytics-mobile-list">
                {pagedMachines.map((machine) => {
                  const capacity = getCapacityValue(machine.count);
                  const capacityColor = getCapacityColor(capacity);
                  const statusTone = getStatusTone(machine.status);
                  const actionConfig = getActionConfig(machine);
                  const isBusy = processingMachineId === machine.id;

                  return (
                    <div className="analytics-mobile-card" key={`mobile-${machine.id}`}>
                      <div className="analytics-mobile-card-header">
                        <div>
                          <p className="analytics-mobile-chip">#{machine.id}</p>
                          <h3>{machine.type || 'ประเภททั่วไป'}</h3>
                        </div>
                        <span className={`status-pill ${statusTone}`}>
                          <span className="dot"></span>
                          {getStatusLabel(machine.status)}
                        </span>
                      </div>

                      <div className="analytics-mobile-grid">
                        <div>
                          <span>สถานที่ตั้ง</span>
                          <strong>{machine.location || 'ยังไม่ได้ระบุสถานที่'}</strong>
                        </div>
                        <div>
                          <span>เจ้าของตู้</span>
                          <strong>{machine.op_name || 'ยังไม่ระบุ'}</strong>
                        </div>
                        <div>
                          <span>จำนวนขวด</span>
                          <strong>{Number(machine.count || 0).toLocaleString('th-TH')}</strong>
                        </div>
                        <div>
                          <span>ความจุ</span>
                          <strong className={`text-${capacityColor}`}>{capacity}%</strong>
                        </div>
                      </div>

                      {currentUserRole === 'admin' ? (
                        <div className="analytics-mobile-actions">
                          {actionConfig.primaryLabel ? (
                            <button
                              className={`action-btn ${actionConfig.primaryType}`}
                              type="button"
                              onClick={() => requestMachineAction(machine, actionConfig.primaryAction)}
                              disabled={isBusy}
                            >
                              {isBusy ? 'กำลังอัปเดต...' : actionConfig.primaryLabel}
                            </button>
                          ) : (
                            <span className="analytics-readonly-label">-</span>
                          )}
                          {actionConfig.secondaryLabel ? (
                            <button
                              className={`action-btn ${actionConfig.secondaryType}`}
                              type="button"
                              onClick={() => requestMachineAction(machine, actionConfig.secondaryAction)}
                              disabled={isBusy}
                            >
                              {actionConfig.secondaryLabel}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="analytics-mobile-actions">
                          <span className="analytics-readonly-label">เฉพาะผู้ดูแลระบบ</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pagination">
                <span className="entries-info">แสดง {startEntry}-{endEntry} จากทั้งหมด {filteredMachines.length} รายการ</span>
                <div className="page-controls">
                  <button
                    className="page-arrow"
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      className={`page-num ${page === currentPage ? 'active' : ''}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-arrow"
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
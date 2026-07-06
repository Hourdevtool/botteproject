import React, { useState, useEffect } from 'react';
import Sidebar from './components/sidebar';
import './css/overview.css';
import { apiUrl } from './lib/api';
import { getAuthToken, useAuth } from './context/AuthContext';

const Overview = () => {
  const { session } = useAuth();
  const token = session?.token || getAuthToken();
  const [machines, setMachines] = useState([]);
  const [stats, setStats] = useState({
    totalMachines: 0,
    totalOperators: 0,
    totalBottles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOverviewData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [machinesRes, dashboardRes] = await Promise.all([
        fetch(apiUrl('/api/admin/machines'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        }),
        fetch(apiUrl('/api/admin/dashboard'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        }),
      ]);

      const machinesPayload = await machinesRes.json().catch(() => null);
      const dashboardPayload = await dashboardRes.json().catch(() => null);

      const machineList = machinesRes.ok && machinesPayload?.status === 'success' ? machinesPayload.data : [];
      const dashboardData = dashboardRes.ok && dashboardPayload?.status === 'success' ? dashboardPayload.data : null;

      setMachines(machineList);
      setStats({
        totalMachines: Number(dashboardData?.total_machines ?? machineList.length ?? 0),
        totalOperators: Number(dashboardData?.total_operators ?? 0),
        totalBottles: Number(dashboardData?.total_bottles ?? 0),
      });

      if (!machinesRes.ok || machinesPayload?.status !== 'success') {
        setErrorMessage(machinesPayload?.message || 'ไม่สามารถโหลดข้อมูลตู้จากฐานข้อมูลได้');
      }
      if (!dashboardRes.ok || dashboardPayload?.status !== 'success') {
        setErrorMessage((prev) => prev || dashboardPayload?.message || 'ไม่สามารถโหลดสรุปข้อมูลแดชบอร์ดได้');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOverviewData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const parseMachineTime = (machine) => {
    const timestamp = machine?.last_seen || machine?.last_online || machine?.updated_at || machine?.updatedAt || machine?.created_at || machine?.createdAt || '';
    const time = new Date(timestamp).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const isMachineOnline = (machine) => {
    const status = String(machine?.status || machine?.machine_status || '').trim().toLowerCase();
    if (!status) {
      return machine?.allow == 1;
    }
    return status.includes('online') || status.includes('ออนไลน์');
  };

  const onlineMachines = machines
    .filter(isMachineOnline)
    .sort((a, b) => parseMachineTime(b) - parseMachineTime(a))
    .slice(0, 3);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/machines/${id}/approve`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ allow: 1 }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.status === 'success') {
        alert('อนุมัติตู้สำเร็จ');
        await fetchOverviewData();
      } else {
        alert(data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="overview-app-container">
      <Sidebar />
      <main className="overview-main-content">
        <div className="overview-header">
          <div className="header-titles">
            <h1>ภาพรวมระบบ</h1>
            <p>ตัวชี้วัดประสิทธิภาพของระบบนิเวศแบบเรียลไทม์</p>
          </div>
          <div className="date-filter">
            <button className="date-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              30 วันล่าสุด
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
        </div>

        <div className="metrics-cards-row">
          <div className="metric-card">
            <div className="metric-card-header">
              <div className="icon-box green">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"/><path d="M14 12h4"/><path d="M18 9v6a2 2 0 0 0 2 2h2"/></svg>
              </div>
              <div className="badge positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                สด
              </div>
            </div>
            <div className="metric-info">
              <p>จำนวนเครื่องที่เปิดใช้งาน</p>
              <h3>{isLoading ? 'กำลังโหลด...' : stats.totalMachines}</h3>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <div className="icon-box cyan">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div className="badge positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                ล่าสุด
              </div>
            </div>
            <div className="metric-info">
              <p>จำนวนเจ้าของตู้</p>
              <h3>{isLoading ? 'กำลังโหลด...' : stats.totalOperators}</h3>
            </div>
          </div>

          <div className="metric-card prominent">
            <div className="metric-card-header">
              <div className="logo-box">
                <span className="logo-text">RE<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{margin: '0 2px'}}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></span>
              </div>
              <div className="live-status">
                <span className="overview-dot pulse"></span>
                กำลังซิงค์ข้อมูล
              </div>
            </div>
            <div className="metric-info">
              <p>ยอดรวมขวดที่รับคืน</p>
              <div className="huge-number-container">
                <h3>{isLoading ? 'กำลังโหลด...' : Number(stats.totalBottles).toLocaleString('th-TH')}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-bottom-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2>แนวโน้มการรับคืน</h2>
                <p>จำนวนขวดที่รับคืนในแต่ละช่วงเวลา</p>
              </div>
              <div className="chart-toggle">
                <button className="active">รายสัปดาห์</button>
                <button>รายเดือน</button>
              </div>
            </div>
            <div className="chart-area">
              <div className="chart-grid">
                <div className="grid-line"></div>
                <div className="grid-line"></div>
                <div className="grid-line"></div>
                <div className="grid-line"></div>
              </div>
              <div className="chart-bars">
                <div className="bar-wrapper"><div className="bar" style={{height: '35%'}}></div><span className="day">จ.</span></div>
                <div className="bar-wrapper"><div className="bar" style={{height: '45%'}}></div><span className="day">อ.</span></div>
                <div className="bar-wrapper"><div className="bar" style={{height: '55%'}}></div><span className="day">พ.</span></div>
                <div className="bar-wrapper"><div className="bar highlight" style={{height: '80%'}}></div><span className="day highlight">พฤ.</span></div>
                <div className="bar-wrapper"><div className="bar" style={{height: '65%'}}></div><span className="day">ศ.</span></div>
                <div className="bar-wrapper"><div className="bar" style={{height: '50%'}}></div><span className="day">ส.</span></div>
                <div className="bar-wrapper"><div className="bar" style={{height: '40%'}}></div><span className="day">อา.</span></div>
              </div>
            </div>
          </div>

          <div className="recently-online-card">
            <div className="card-header">
              <h2>เครื่องที่ออนไลน์ล่าสุด</h2>
              <a href="analytics" className="view-all">ดูทั้งหมด</a>
            </div>
            <div className="machine-list">
              {errorMessage ? (
                <div className="analytics-empty-state" style={{ marginBottom: '1rem' }}>
                  <p>{errorMessage}</p>
                </div>
              ) : null}
              {onlineMachines.length > 0 ? onlineMachines.map((m) => (
                <div className={`machine-list-item bg-${m.allow == 1 ? 'green' : 'orange'}`} key={m.id}>
                  <div className="item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"/><path d="M14 12h4"/><path d="M18 9v6a2 2 0 0 0 2 2h2"/></svg>
                  </div>
                  <div className="item-info">
                    <h4>{m.name || `Machine #${m.id}`}</h4>
                    <p>{m.location || 'ไม่มีข้อมูลตำแหน่ง'}</p>
                  </div>
                  <div className="item-status" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-badge ${m.allow == 1 ? 'online' : 'full'}`}>
                      {m.allow == 1 ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                    </span>
                    {/* {m.allow != 1 && (
                      <button
                        onClick={() => handleApprove(m.id)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#1A4D2E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        อนุมัติ
                      </button>
                    )} */}
                  </div>
                </div>
              )) : (
                <div className="analytics-empty-state">
                  <p>ยังไม่มีข้อมูลตู้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Overview;
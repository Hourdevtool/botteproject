import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NotificationModal from './components/notification_modal';
import './css/machine_config.css';
import { apiUrl } from './lib/api';
import { getAuthToken, useAuth } from './context/AuthContext';

const MACHINE_RATE_KEYS = ['clear', 'opaque', 'brown'];
const RATE_LABELS = {
  clear: 'ขวดพลาสติกใส',
  opaque: 'ขวดพลาสติกขุ่น',
  brown: 'ขวดพลาสติกสีชา',
};

const MachineConfig = () => {
  const navigate = useNavigate();
  const { machineId } = useParams();
  const { session } = useAuth();
  const token = session?.token || getAuthToken();
  const [machine, setMachine] = useState(null);
  const [rewardType, setRewardType] = useState('point');
  const [rateInputs, setRateInputs] = useState({ clear: '', opaque: '', brown: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'info',
  });

  const openNotification = (title, description, variant = 'info') => {
    setNotification({ open: true, title, description, variant });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const loadMachine = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!currentUser?.id) {
          setMachine(null);
          return;
        }

        const response = await fetch(apiUrl(`/api/machine/${currentUser.id}`), {
          headers: { Authorization: `Bearer ${token || ''}` },
        });

        const payload = await response.json().catch(() => null);

        if (response.ok && payload?.status === 'success' && Array.isArray(payload.data)) {
          const foundMachine = payload.data.find((item) => String(item.id) === String(machineId));
          setMachine(foundMachine || null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (machineId) {
      loadMachine();
    } else {
      setIsLoading(false);
    }
  }, [machineId, token]);

  useEffect(() => {
    const loadConfig = async () => {
      if (!machineId) return;
      try {
        const response = await fetch(apiUrl(`/api/operator/machines/${machineId}/config`), {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        const payload = await response.json().catch(() => null);

        if (response.ok && payload?.status === 'success' && payload.data) {
          setRewardType(payload.data.type === 'money' ? 'money' : 'point');
          const values = payload.data.type === 'money' ? payload.data.base_prices : payload.data.rates;
          setRateInputs({
            clear: values?.clear ?? '',
            opaque: values?.opaque ?? '',
            brown: values?.brown ?? '',
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadConfig();
  }, [machineId, token]);

  const handleRateChange = (key, value) => {
    let normalizedValue = value;
    const parsedValue = parseFloat(value);
    if (!Number.isNaN(parsedValue) && parsedValue < 1) {
      normalizedValue = '1';
    }
    setRateInputs((prev) => ({
      ...prev,
      [key]: normalizedValue,
    }));
  };

  const validateRateInputs = () => {
    if (rewardType === 'money') {
      return true;
    }

    for (const key of MACHINE_RATE_KEYS) {
      const value = String(rateInputs[key]).trim();
      if (value === '' || Number.isNaN(Number(value))) {
        openNotification('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกค่าทั้งสามประเภทด้วยตัวเลขที่ถูกต้อง', 'error');
        return false;
      }
      if (Number(value) < 1) {
        openNotification('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกแต้มอย่างน้อย 1 ขึ้นไป', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!machineId) {
      openNotification('ไม่พบรหัสเครื่อง', 'ไม่สามารถบันทึกการตั้งค่าได้', 'error');
      return;
    }
    if (!validateRateInputs()) {
      return;
    }

    const formData = new URLSearchParams();
    formData.append('_method', 'PUT');
    formData.append('type', rewardType);

    if (rewardType === 'point') {
      MACHINE_RATE_KEYS.forEach((key) => {
        formData.append(`rates[${key}]`, String(Math.max(1, parseFloat(rateInputs[key]) || 1)));
      });
    }

    setIsSaving(true);
    try {
      const response = await fetch(apiUrl(`/api/operator/machines/${machineId}/config`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData.toString(),
      });

      let result = null;
      let responseBody = null;
      const text = await response.text();
      if (text) {
        responseBody = text;
        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }
      }

      if (response.ok && result?.status === 'success') {
        openNotification('บันทึกสำเร็จ', 'การตั้งค่าเครื่องถูกบันทึกเรียบร้อยแล้ว', 'success');
      } else {
        const errorMessage = result?.message || responseBody || `${response.status} ${response.statusText}`;
        openNotification('เกิดข้อผิดพลาด', errorMessage, 'error');
      }
    } catch (error) {
      openNotification('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const approvalStatus = machine?.status
    ? String(machine.status).toLowerCase().includes('online')
      ? 'อนุมัติแล้ว'
      : machine.status
    : 'กำลังโหลด';

  return (
    <div className="mc-layout-container">
      <main className="mc-main-content">
        <div className="mc-header">
          <button className="mc-back-btn" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="mc-title">การตั้งค่าเครื่องจักร</h1>
            <p className="mc-subtitle">รหัสเครื่อง: {machine?.name || machineId || 'ไม่ระบุ'}</p>
          </div>
        </div>

        <div className="mc-content-grid">
          <div className="mc-left-column">
            <div className="mc-card">
              <div className="mc-card-header">
                <div className="mc-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></svg>
                </div>
                <h2>รูปแบบการให้รางวัล</h2>
              </div>
              <p className="mc-card-desc">เลือกประเภทการคำนวณเรทราคาให้ตรงกับการตั้งค่าเครื่อง</p>
              <div className="mc-options-row">
                <div className={`mc-option-box ${rewardType === 'money' ? 'active' : ''}`} onClick={() => setRewardType('money')}>
                  <div className="mc-option-header">
                    <div className={`mc-radio-circle ${rewardType === 'money' ? 'checked' : ''}`}>
                      {rewardType === 'money' && <div className="mc-radio-inner"></div>}
                    </div>
                  </div>
                  <h3>เงิน</h3>
                  <p>ระบบจะบันทึกเป็น 80% ให้อัตโนมัติ</p>
                </div>
                <div className={`mc-option-box ${rewardType === 'point' ? 'active' : ''}`} onClick={() => setRewardType('point')}>
                  <div className="mc-option-header">
                    <div className={`mc-radio-circle ${rewardType === 'point' ? 'checked' : ''}`}>
                      {rewardType === 'point' && <div className="mc-radio-inner"></div>}
                    </div>
                  </div>
                  <h3>คะแนน</h3>
                  <p>กำหนดแต้มต่อกรัมตามประเภทขวดได้โดยตรง</p>
                </div>
              </div>
            </div>

            {rewardType === 'money' ? (
              <div className="mc-card">
                <div className="mc-card-header">
                  <div className="mc-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                  </div>
                  <h2>ตั้งค่าเป็นเงิน</h2>
                </div>
                <p className="mc-card-desc">เมื่อเลือกเป็นเงิน จะใช้ราคากลางจาก API กลาง และไม่สามารถปรับเรทราคาเองได้ที่นี่</p>
                <div className="mc-notice-box" style={{ marginTop: '1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  <p>ระบบจะใช้ราคากลางจาก API กลางและคำนวณค่าให้ตามเงื่อนไข 80% โดยไม่จำเป็นต้องใส่เรทเอง</p>
                </div>
              </div>
            ) : (
              <div className="mc-card">
                <div className="mc-card-header">
                  <div className="mc-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                  </div>
                  <h2>เรทตามประเภทขวด</h2>
                </div>
                <p className="mc-card-desc">ตั้งค่าเรทตามแต่ละประเภทขวด</p>
                <div className="mc-material-list">
                  {MACHINE_RATE_KEYS.map((key) => (
                    <div className="mc-material-item mc-bg-light-green" key={key}>
                      <div className="mc-material-info">
                        <div className="mc-material-icon-box">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M10 3v4h4V3H10Z" /><path d="M12 13v4" /><path d="M10 15h4" /></svg>
                        </div>
                        <div>
                          <h4>{RATE_LABELS[key]}</h4>
                          <p>บันทึกค่าต่อกรัมสำหรับประเภทนี้</p>
                        </div>
                      </div>
                      <div className="mc-input-group">
                        <input
                          type="number"
                          value={rateInputs[key]}
                          onChange={(e) => handleRateChange(key, e.target.value)}
                          step="0.1"
                          min="1"
                        />
                        <span>แต้ม / กรัม</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mc-right-column">
            <div className="mc-status-card">
              {/* <img src="https://images.unsplash.com/photo-1595278069441-2f29f80034b3?auto=format&fit=crop&q=80&w=600&h=300" alt="Machine" className="mc-machine-img" /> */}
              <div className="mc-status-info">
                <h3>สถานะเครื่อง</h3>
                <div className="mc-status-badge">
                  <span className="mc-dot-online"></span> {machine?.status || 'กำลังโหลดสถานะ'}
                </div>
                <div className="mc-info-list">
                  <div className="mc-info-row">
                    <span className="mc-info-label">สถานที่ตั้ง</span>
                    <span className="mc-info-value">{machine?.location || 'ยังไม่ได้ระบุ'}</span>
                  </div>
                  <div className="mc-info-row">
                    <span className="mc-info-label">สถานะการอนุมัติ</span>
                    <span className="mc-info-value">{approvalStatus}</span>
                  </div>
                </div>
                <div className="mc-notice-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  <p>การบันทึกข้อมูลช่วยให้ระบบคำนวณรางวัลสำหรับผู้ใช้งานถัดไปได้ถูกต้อง</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mc-actions-footer">
          <button className="mc-btn-save" onClick={handleSave} disabled={isSaving}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
          <button className="mc-btn-cancel" onClick={() => navigate(-1)} disabled={isSaving}>ยกเลิก</button>
        </div>
      </main>

      <NotificationModal
        open={notification.open}
        title={notification.title}
        description={notification.description}
        variant={notification.variant}
        confirmLabel="ตกลง"
        onConfirm={closeNotification}
        onCancel={closeNotification}
      />
    </div>
  );
};

export default MachineConfig;
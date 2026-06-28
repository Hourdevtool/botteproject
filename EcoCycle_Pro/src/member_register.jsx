import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './css/member_register.css';
import { apiUrl } from './lib/api';

const MemberRegister = () => {
  const { m_id } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    phonenumber: '',
    age: '',
    gender: '',
    localtion: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // --- ควบคุมการกรอกเบอร์โทรศัพท์เฉพาะหน้า Frontend ---
    if (name === 'phonenumber') {
      // อนุญาตเฉพาะตัวเลขเท่านั้น (ลบอักขระอื่นออกทั้งหมด) และจำกัดความยาวสูงสุด 11 ตัวอักษร
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length > 11) return; 
      
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // 1. --- ตรวจสอบการกรอกข้อมูลครบทุกช่อง (Required Fields Validation) ---
    if (
      !formData.fname.trim() || 
      !formData.lname.trim() || 
      !formData.phonenumber.trim() || 
      !formData.age.toString().trim() || 
      !formData.gender || 
      !formData.localtion.trim()
    ) {
      setNotification({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
      return;
    }

    const phoneTrimmed = formData.phonenumber.trim();
    
    const phoneRegex = /^0[0-9]{9,10}$/;
    
    if (!phoneRegex.test(phoneTrimmed)) {
      setNotification({ 
        type: 'error', 
        message: 'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วยเลข 0 และมีจำนวน 10-11 หลักเท่านั้น' 
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotification({ type: '', message: '' });

      const response = await fetch(apiUrl(`/api/user/machines/${m_id}/register`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fname: formData.fname.trim(),
          lname: formData.lname.trim(),
          phonenumber: phoneTrimmed,
          age: Number(formData.age),
          gender: formData.gender,
          localtion: formData.localtion.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }

      // Store user data and token in AuthContext
      const userData = {
        id: payload.data?.id,
        fname: payload.data?.fname,
        lname: payload.data?.lname,
        point: payload.data?.point,
        machineId: m_id,
        role: 'user',
      };
      login(userData, payload.token);

      setNotification({ type: 'success', message: 'ลงทะเบียนสำเร็จ! กำลังนำคุณไปยังหน้าแดชบอร์ด...' });
      
      setTimeout(() => {
        navigate(`/member_dashboard/${payload.data.id}`); 
      }, 1800);

    } catch (error) {
      setNotification({ type: 'error', message: error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-reg-container">
      <div className="user-reg-card">
        <div className="card-header-bg"></div>

        <div className="user-reg-logo-container">
          <div className="user-reg-logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#063c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </div>
        </div>

        <div className="card-body">
          <div className="reg-titles">
            <h2>ยินดีต้อนรับสู่ EcoCycle</h2>
            <p>ลงทะเบียนเพื่อเริ่มต้นการรีไซเคิลที่ตู้ {m_id ? `#${m_id}` : ''}</p>
          </div>

          {notification.message && (
            <div className={`reg-toast-alert alert-${notification.type}`}>
              <div className="alert-icon">
                {notification.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
              </div>
              <div className="alert-content">{notification.message}</div>
            </div>
          )}

          <div className="reg-form">
            {/* ชื่อ-นามสกุล */}
            <div className="form-row">
              <div className="user-reg-form-group half">
                <label>ชื่อ <span className="required-star">*</span></label>
                <div className="user-reg-input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    type="text"
                    name="fname"
                    value={formData.fname}
                    onChange={handleChange}
                    placeholder="ชื่อจริง"
                  />
                </div>
              </div>
              <div className="user-reg-form-group half">
                <label>นามสกุล <span className="required-star">*</span></label>
                <div className="user-reg-input-no-icon">
                  <input
                    type="text"
                    name="lname"
                    value={formData.lname}
                    onChange={handleChange}
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div className="user-reg-form-group">
              <label>เบอร์โทรศัพท์ <span className="required-star">*</span></label>
              <div className="user-reg-input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <input
                  type="text" 
                  inputMode="numeric" 
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleChange}
                  placeholder="0XXXXXXXXX"
                />
              </div>
            </div>

            {/* อายุ + เพศ */}
            <div className="form-row">
              <div className="user-reg-form-group half">
                <label>อายุ <span className="required-star">*</span></label>
                <div className="user-reg-input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="ระบุอายุ"
                  />
                </div>
              </div>
              <div className="user-reg-form-group half">
                <label>เพศ <span className="required-star">*</span></label>
                <div className="user-reg-input-with-icon custom-select-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="" disabled>เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ที่อยู่ */}
            <div className="user-reg-form-group">
              <label>ที่อยู่ (เขต/อำเภอ) <span className="required-star">*</span></label>
              <div className="user-reg-input-with-icon align-top">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <textarea
                  name="localtion"
                  rows="2"
                  value={formData.localtion}
                  onChange={handleChange}
                  placeholder="ระบุข้อมูลที่อยู่เบื้องต้น"
                />
              </div>
            </div>

            <button
              type="button"
              className="user-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>กำลังบันทึกข้อมูล...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  ลงทะเบียนเข้าใช้งาน
                </>
              )}
            </button>
          </div>

          <p className="reg-footer-text">
            การลงทะเบียนหมายความว่าคุณยอมรับ<br/>
            <a href="#">ข้อตกลงและเงื่อนไข</a> และ <a href="#">นโยบายความเป็นส่วนตัว</a>
          </p>

          <div className="reg-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
            <p>มีบัญชีอยู่แล้ว? <a href={`/member_login_machine/${m_id || ''}`} style={{ color: '#063c2c', fontWeight: '600', textDecoration: 'none' }}>เข้าสู่ระบบที่นี่</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberRegister;
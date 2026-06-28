import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/op_register.css';
import { apiUrl } from './lib/api';
import { getAuthToken, useAuth } from './context/AuthContext';

const OpRegister = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.token || getAuthToken();
  const [formData, setFormData] = useState({
    op_name: '',
    email: '',
    phonenumber: '',
    password: '',
    confirmPassword: '',
    installationAddress: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    const opName = formData.op_name.trim();
    const email = formData.email.trim();
    const phone = formData.phonenumber.trim();

    if (!opName) {
      setStatus({ type: 'error', message: 'กรุณากรอกชื่อบริษัท / ผู้ดำเนินการ' });
      return;
    }

    if (!email) {
      setStatus({ type: 'error', message: 'กรุณากรอกอีเมล' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus({ type: 'error', message: 'รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกใหม่' });
      return;
    }

    if (!phone) {
      setStatus({ type: 'error', message: 'กรุณากรอกเบอร์โทรศัพท์' });
      return;
    }

    const phonePattern = /^0\d{8,9}$/;
    if (!phonePattern.test(phone)) {
      setStatus({ type: 'error', message: 'เบอร์โทรศัพท์ต้องเป็น 10-11 หลักและขึ้นต้นด้วย 0' });
      return;
    }

    if (!formData.password) {
      setStatus({ type: 'error', message: 'กรุณากรอกรหัสผ่าน' });
      return;
    }

    if (formData.password.length < 6) {
      setStatus({ type: 'error', message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    if (!formData.confirmPassword) {
      setStatus({ type: 'error', message: 'กรุณายืนยันรหัสผ่าน' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'ยืนยันรหัสผ่านไม่ตรงกับรหัสผ่าน' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(apiUrl('/api/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          op_name: opName,
          email,
          phonenumber: phone,
          password: formData.password,
        }),
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.message || 'ไม่สามารถลงทะเบียนได้ในขณะนี้');
      }

      setStatus({ type: 'success', message: 'ลงทะเบียนสำเร็จแล้ว กำลังพาไปหน้าเข้าสู่ระบบ' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="op-register-container">
      <div className="op-register-card">
        <div className="op-register-left">
          <h1 className="op-title">เข้าร่วมระบบทรัพยากรหมุนเวียนที่ยั่งยืน</h1>
          <p className="op-subtitle">
            ร่วมเป็นพันธมิตรกับ EcoCycle Pro เพื่อเปลี่ยนการจัดการขยะให้เป็นประสบการณ์ที่ยั่งยืนและคุ้มค่าสำหรับชุมชนของคุณ
          </p>

          <div className="op-features">
            <div className="op-feature-item">
              <div className="op-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <div className="op-feature-text">
                <h3>ดึงดูดลูกค้าและผู้ใช้บริการ</h3>
                <p>ดึงดูดผู้บริโภคที่ใส่ใจสิ่งแวดล้อมและกำลังมองหาจุดรีไซเคิลที่ใช้งานได้อย่างสะดวกสบาย</p>
              </div>
            </div>

            <div className="op-feature-item">
              <div className="op-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
              </div>
              <div className="op-feature-text">
                <h3>วิเคราะห์ข้อมูลแบบเรียลไทม์</h3>
                <p>เข้าถึงหน้าแดชบอร์ดแบบครบวงจรเพื่อตรวจสอบสถานะความจุของเครื่องและการใช้งานของผู้ใช้ได้ทันที</p>
              </div>
            </div>

            <div className="op-feature-item">
              <div className="op-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
              </div>
              <div className="op-feature-text">
                <h3>บรรลุเป้าหมายด้านความยั่งยืน</h3>
                <p>แสดงให้เห็นถึงความมุ่งมั่นในการดูแลสิ่งแวดล้อมอย่างเป็นรูปธรรม ด้วยตัวชี้วัดที่สามารถตรวจสอบได้</p>
              </div>
            </div>
          </div>
        </div>

        <div className="op-register-right">
          <h2 className="op-form-title">ลงทะเบียนผู้ดำเนินการ</h2>
          <p className="op-form-subtitle">กรอกรายละเอียดด้านล่างเพื่อเริ่มต้นกระบวนการติดตั้งและเปิดใช้งานเครื่องของคุณ</p>

          <form className="op-form" onSubmit={handleSubmit}>
            <div className="op-form-group">
              <label>ชื่อบริษัท / ผู้ดำเนินการ</label>
              <div className="op-input-wrapper">
                <svg className="op-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                <input
                  type="text"
                  name="op_name"
                  value={formData.op_name}
                  onChange={handleChange}
                  placeholder="เช่น บริษัท กรีนเทค โซลูชั่นส์ จำกัด"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="op-form-group">
              <label>ที่อยู่สำหรับติดตั้ง</label>
              <div className="op-input-wrapper">
                <svg className="op-input-icon op-icon-top" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                <textarea
                  name="installationAddress"
                  value={formData.installationAddress}
                  onChange={handleChange}
                  placeholder="ระบุที่อยู่และสถานที่ตั้งเครื่องอย่างละเอียด"
                />
              </div>
            </div>

            <div className="op-form-row">
              <div className="op-form-group op-half">
                <label>อีเมล</label>
                <div className="op-input-wrapper">
                  <svg className="op-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="op-form-group op-half">
                <label>เบอร์โทรศัพท์</label>
                <div className="op-input-wrapper">
                  <svg className="op-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <input
                    type="tel"
                    name="phonenumber"
                    value={formData.phonenumber}
                    onChange={handleChange}
                    placeholder="0XXXXXXXXX"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="op-form-row">
              <div className="op-form-group op-half">
                <label>รหัสผ่าน</label>
                <div className="op-input-wrapper">
                  <svg className="op-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="op-form-group op-half">
                <label>ยืนยันรหัสผ่าน</label>
                <div className="op-input-wrapper">
                  <svg className="op-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {status.message ? (
              <div className={`op-form-status ${status.type}`}>{status.message}</div>
            ) : null}

            <button type="submit" className="op-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเป็นผู้ดำเนินการ'}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>

            <p className="op-terms">
              การลงทะเบียนแสดงว่าคุณยอมรับข้อกำหนดการให้บริการและนโยบายความเป็นส่วนตัวของเรา
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OpRegister;
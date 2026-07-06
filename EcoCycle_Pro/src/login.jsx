import React, { useState } from 'react';
import './css/login.css';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from './lib/api';
import { useAuth } from './context/AuthContext';

const LOGIN_ENDPOINT = apiUrl('/api/login');

const Login = () => {
  const [role, setRole] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setStatus({ type: 'error', message: 'กรุณากรอกอีเมล' });
      return;
    }

    if (!password) {
      setStatus({ type: 'error', message: 'กรุณากรอกรหัสผ่าน' });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await response.json().catch(() => ({
        status: 'error',
        message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้',
      }));

      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      setStatus({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ กำลังนำทาง...' });

      if (payload.user && payload.token) {
        login(payload.user, payload.token);
      }

      const redirectPath = payload.user?.role === 'operator' ? '/my_machine' : '/overview';
      setTimeout(() => navigate(redirectPath), 800);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="login-card">
        <div className="login-header" onClick={handleBackToHome} style={{ cursor: 'pointer' }}>
          <div className="login-logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" display="none" />
              <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5zm-5-3c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" fill="white" display="none" />
              <path d="M11.646 2.354a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L12 3.414 6.354 9.06a.5.5 0 1 1-.708-.708l6-6z" display="none" />
              <path d="M2.5 12a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0zm9.5-8a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" display="none" />
              <path d="M17.5 2.5a13.24 13.24 0 0 0-8 3.5c-4.5 4.5-5 11.5-5 11.5s7-.5 11.5-5a13.24 13.24 0 0 0 3.5-8s-1.5-2-2-2z" fill="#059669" />
              <path d="M17 5L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 13l-3 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1>EcoCycle Pro</h1>
          <p>ระบบจัดการทรัพยากรหมุนเวียน</p>
        </div>

        {/* <div className="role-toggle">
          <button
            className={`toggle-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
            type="button"
          >
            ผู้ดูแลระบบ
          </button>
          <button
            className={`toggle-btn ${role === 'operator' ? 'active' : ''}`}
            onClick={() => setRole('operator')}
            type="button"
          >
            เจ้าของตู้
          </button>
        </div> */}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>อีเมล</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="กรอกอีเมลของคุณ"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>รหัสผ่าน</label>
              <a href="#" className="forgot-password">ลืมรหัสผ่าน?</a>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {status.message ? (
            <div className={`form-status ${status.type}`}>{status.message}</div>
          ) : null}

          <button type="submit" className="login-btn-submit" disabled={isSubmitting}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="login-footer">
          <p>เข้าสู่ระบบเพื่อจัดการโครงสร้างพื้นฐาน EcoCycle อย่างปลอดภัย</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
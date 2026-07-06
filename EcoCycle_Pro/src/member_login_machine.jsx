import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { apiUrl } from './lib/api';
import './css/member_login_machine.css';

const MemberLoginMachine = () => {
  const navigate = useNavigate();
  const { m_id } = useParams();
  const { login } = useAuth();
  
  const [phonenumber, setPhonenumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phonenumber.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    if (!/^0[0-9]{9}$/.test(phonenumber.replace(/[^\d]/g, ''))) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (0xx-xxx-xxxx)');
      return;
    }

    const activeMachineId = m_id || '';
    if (!activeMachineId.trim()) {
      setError('กรุณาระบุรหัสตู้ (Machine ID)');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = `/api/user/machines/${activeMachineId}/login`;

      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phonenumber }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess('เข้าสู่ระบบสำเร็จ กำลังเปลี่ยนหน้า...');
        
        // Store user data
        const userData = {
          id: data.data?.id,
          fname: data.data?.fname,
          lname: data.data?.lname,
          point: data.data?.point,
          machineId: activeMachineId || data.data?.machineId,
          role: 'user',
        };
        
        login(userData, data.token);
        
        // Redirect to user dashboard
        setTimeout(() => {
          navigate(`/member_dashboard/${data.data.id}`, { state: { machineId: activeMachineId } });
        }, 800);
      } else {
        setError(data.message || 'เข้าสู่ระบบล้มเหลว กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-login-container">
      <div className="user-login-card">
        <div className="card-header-bg"></div>
        
        <div className="user-login-logo-container">
          <div className="user-login-logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#063c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </div>
        </div>

        <div className="card-body">
          <div className="login-titles">
            <h2>เข้าสู่ระบบ</h2>
            <p>เข้าสู่ระบบด้วยเบอร์โทรศัพท์ของคุณ</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="user-login-form" onSubmit={handleLogin}>
            <div className="user-login-form-group">
              <label>เบอร์โทรศัพท์</label>
              <div className="user-login-input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <input
                  type="tel"
                  placeholder="0xx-xxx-xxxx"
                  value={phonenumber}
                  onChange={(e) => setPhonenumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login-user"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="login-footer">
            <p>ยังไม่มีบัญชี? <a href={`/register/${m_id || ''}`}>ลงทะเบียนที่นี่</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberLoginMachine;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuthToken } from './context/AuthContext';
import UserSidebar from './components/member_sidebar';
import NotificationModal from './components/notification_modal';
import { apiUrl } from './lib/api';
import './css/member_redeem.css';

const MemberRedeem = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const token = session?.token || getAuthToken();

  const [userProfile, setUserProfile] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [machineId, setMachineId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    title: '',
    description: '',
    type: 'success',
  });

  useEffect(() => {
    if (!token) {
      navigate('/member_login_machine');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(apiUrl('/api/user/me'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setUserProfile(data.data);
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          setMachineId(storedUser.machineId || '');
        } else {
          navigate('/member_login_machine');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        navigate('/member_login_machine');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleRedeem = async (e) => {
    e.preventDefault();

    const amount = parseFloat(redeemAmount);

    if (!redeemAmount || amount <= 0) {
      setNotification({
        open: true,
        title: 'ข้อผิดพลาด',
        description: `กรุณากรอกจำนวน${userProfile?.machine_type === 'money' ? 'เงิน' : 'แต้ม'}ให้ถูกต้อง`,
        type: 'error',
      });
      return;
    }

    if (amount > (userProfile?.point || 0)) {
      setNotification({
        open: true,
        title: 'ข้อผิดพลาด',
        description: `${userProfile?.machine_type === 'money' ? 'ยอดเงิน' : 'แต้ม'}ไม่เพียงพอ กรุณาตรวจสอบจำนวน${userProfile?.machine_type === 'money' ? 'ยอดเงิน' : 'แต้ม'}ของคุณ`,
        type: 'error',
      });
      return;
    }

    if (!machineId) {
      setNotification({
        open: true,
        title: 'ข้อผิดพลาด',
        description: 'ไม่พบรหัสตู้ กรุณาลองใหม่',
        type: 'error',
      });
      return;
    }

    setNotification({
      open: true,
      title: 'ยืนยันการแลก',
      description: `คุณต้องการแลก ${amount} ${userProfile?.machine_type === 'money' ? 'บาท' : 'แต้ม'} ใช่หรือไม่?`,
      type: 'confirm',
      action: 'redeem'
    });
  };

  const executeRedeem = async () => {
    setIsSubmitting(true);
    const amount = parseFloat(redeemAmount);

    try {
      const response = await fetch(apiUrl(`/api/user/machines/${machineId}/redeem`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === 'success' || data.status === 'pending')) {
        // ระบบใหม่: คำขอถูกบันทึกรอการอนุมัติ (ไม่ตัดแต้มทันที)
        setNotification({
          open: true,
          title: 'ส่งคำขอแลกสำเร็จ',
          description: `ส่งคำขอแลก ${amount} ${userProfile?.machine_type === 'money' ? 'บาท' : 'แต้ม'} แล้ว\nกรุณารอเจ้าของตู้อนุมัติ แต้มของคุณจะถูกหักเมื่อเจ้าของตู้ยืนยันเท่านั้น`,
          type: 'success',
        });

        // Reset form
        setRedeemAmount('');

        // Redirect after 2.5 seconds
        setTimeout(() => {
          navigate('/member_redeem');
        }, 2500);
      } else {
        setNotification({
          open: true,
          title: 'ข้อผิดพลาด',
          description: data.message || 'ไม่สามารถแลกเปลี่ยนได้',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setNotification({
        open: true,
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการส่งข้อมูล',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickRedeemAmounts = [10, 25, 50, 100];

  const handleQuickRedeem = (amount) => {
    if (amount <= (userProfile?.point || 0)) {
      setRedeemAmount(amount.toString());
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/member_login_machine');
  };

  if (isLoading) {
    return (
      <div className="user-redeem-loading">
        <div className="user-redeem-loader"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="user-redeem-container">
      <UserSidebar userProfile={userProfile} onLogout={handleLogout} />

      <div className="user-redeem-content">
        <div className="redeem-header">
          <h1>{userProfile?.machine_type === 'money' ? 'แลกเงิน' : 'แลกแต้ม'}</h1>
          <p>{userProfile?.machine_type === 'money' ? 'ถอนยอดเงินสะสมของคุณ' : 'แลกแต้มของคุณเป็นเงิน'}</p>
        </div>

        <div className="redeem-card">
          <div className="points-display-section">
            <div className="points-box">
              <span className="label">{userProfile?.machine_type === 'money' ? 'ยอดเงินทั้งหมด' : 'แต้มทั้งหมด'}</span>
              <span className="amount">{userProfile?.point || 0}</span>
              <span className="unit">{userProfile?.machine_type === 'money' ? 'บาท' : 'แต้ม'}</span>
            </div>
          </div>

          <form className="redeem-form" onSubmit={handleRedeem}>
            {/* Amount Input */}
            <div className="user-redeem-form-group">
              <label>จำนวน{userProfile?.machine_type === 'money' ? 'เงิน' : 'แต้ม'}ที่ต้องการแลก</label>
              <div className="user-redeem-input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <input
                  type="number"
                  step="1"
                  placeholder={`ระบุจำนวน${userProfile?.machine_type === 'money' ? 'เงิน' : 'แต้ม'}ที่ต้องการแลก`}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  disabled={isSubmitting}
                  max={userProfile?.point || 0}
                  required
                />
              </div>
              <small className="form-hint">
                คุณมี{userProfile?.machine_type === 'money' ? 'ยอดเงินสะสม' : 'แต้มสะสม'} {userProfile?.point || 0} {userProfile?.machine_type === 'money' ? 'บาท' : 'แต้ม'}ที่สามารถแลกได้
              </small>
            </div>

            {/* Quick Amount Buttons */}
            <div className="quick-amount-section">
              <label>เลือกปริมาณ</label>
              <div className="quick-buttons">
                {quickRedeemAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`quick-btn ${
                      amount <= (userProfile?.point || 0)
                        ? 'available'
                        : 'unavailable'
                    }`}
                    onClick={() => handleQuickRedeem(amount)}
                    disabled={amount > (userProfile?.point || 0)}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-redeem"
              disabled={isSubmitting || !redeemAmount}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการแลก'}
            </button>
          </form>
        </div>
      </div>

      <NotificationModal
        open={notification.open}
        title={notification.title}
        description={notification.description}
        variant={notification.type}
        onConfirm={() => {
          if (notification.type === 'confirm' && notification.action === 'redeem') {
            executeRedeem();
          } else {
            setNotification({ ...notification, open: false });
          }
        }}
        onCancel={() => setNotification({ ...notification, open: false })}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default MemberRedeem;

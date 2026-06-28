import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuthToken } from './context/AuthContext';
import UserSidebar from './components/member_sidebar';
import NotificationModal from './components/notification_modal';
import { apiUrl } from './lib/api';
import './css/member_profile.css';

const MemberProfile = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const token = session?.token || getAuthToken();

  const [memberProfile, setMemberProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
          setMemberProfile(data.data);
        } else {
          setNotification({
            open: true,
            title: 'ข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลโปรไฟล์',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setNotification({
          open: true,
          title: 'ข้อผิดพลาด',
          description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    logout();
    navigate('/member_login_machine');
  };

  if (isLoading) {
    return (
      <div className="user-profile-loading">
        <div className="user-profile-loader"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <UserSidebar userProfile={memberProfile} onLogout={logout} />

      <div className="user-profile-content">
        <div className="profile-header">
          <h1>โปรไฟล์ของฉัน</h1>
          <p>ดูและจัดการข้อมูลส่วนตัว</p>
        </div>

        <div className="profile-card">
          {/* Profile Avatar and Basic Info */}
          <div className="profile-top">
            <div className="profile-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="basic-info">
              <h2>{memberProfile?.fname} {memberProfile?.lname}</h2>
              <p className="status">สมาชิกที่ใช้งาน</p>
            </div>
          </div>

          {/* Points Summary */}
          <div className="points-summary">
            <div className="summary-box">
              <span className="label">แต้มทั้งหมด</span>
              <span className="value">{memberProfile?.point || 0}</span>
              <span className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Personal Information */}
          <div className="profile-section">
            <h3 className="section-title">ข้อมูลส่วนตัว</h3>
            <div className="profile-grid">
              <div className="profile-item">
                <label>ชื่อ</label>
                <p>{memberProfile?.fname || 'ไม่ระบุ'}</p>
              </div>
              <div className="profile-item">
                <label>นามสกุล</label>
                <p>{memberProfile?.lname || 'ไม่ระบุ'}</p>
              </div>
              <div className="profile-item">
                <label>เบอร์โทรศัพท์</label>
                <p>{memberProfile?.phonenumber || 'ไม่ระบุ'}</p>
              </div>
              <div className="profile-item">
                <label>อายุ</label>
                <p>{memberProfile?.age || 'ไม่ระบุ'}</p>
              </div>
              <div className="profile-item">
                <label>เพศ</label>
                <p>
                  {memberProfile?.gender
                    ? (memberProfile.gender.toLowerCase() === 'male'
                      ? 'ชาย'
                      : memberProfile.gender.toLowerCase() === 'female'
                        ? 'หญิง'
                        : 'ไม่ระบุ')
                    : 'ไม่ระบุ'}
                </p>
              </div>
              <div className="profile-item">
                <label>ที่อยู่</label>
                <p>{memberProfile?.localtion || memberProfile?.location || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="profile-section">
            <h3 className="section-title">ข้อมูลบัญชี</h3>
            <div className="account-info-list">
              <div className="info-row">
                <span className="label">ประเภทบัญชี</span>
                <span className="value">ผู้ใช้งานตู้</span>
              </div>
              <div className="info-row">
                <span className="label">สถานะบัญชี</span>
                <span className="value status-active">ใช้งาน</span>
              </div>
              <div className="info-row">
                <span className="label">วันที่สมัคร</span>
                <span className="value">{memberProfile?.createat ? new Date(memberProfile.createat).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="profile-actions">
            <button
              className="action-btn primary"
              onClick={() => navigate('/member_dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              กลับไปแดชบอร์ด
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <NotificationModal
        open={notification.open}
        title={notification.title}
        description={notification.description}
        variant={notification.type}
        onConfirm={() => setNotification({ ...notification, open: false })}
        onCancel={() => setNotification({ ...notification, open: false })}
      />
      
      <NotificationModal
        open={showLogoutConfirm}
        title="ยืนยันการออกจากระบบ"
        description="คุณต้องการออกจากระบบใช่หรือไม่?"
        variant="confirm"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default MemberProfile;

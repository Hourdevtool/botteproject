import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuthToken } from './context/AuthContext';
import UserSidebar from './components/member_sidebar';
import NotificationModal from './components/notification_modal';
import { apiUrl } from './lib/api';
import './css/member_dashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const token = session?.token || getAuthToken();
  const { userId } = useParams();
  
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    title: '',
    description: '',
    type: 'success',
  });

    useEffect(() => {
      // If we don't have token and no userId, navigate to login
      if (!token && !userId) {
        navigate('/member_login_machine');
        return;
      }
  
      const fetchProfile = async () => {
        try {
          const endpoint = userId ? `/api/user/profile/${userId}` : '/api/user/me';
          const headers = userId ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          };
  
          const response = await fetch(apiUrl(endpoint), {
            method: 'GET',
            headers: headers,
          });
  
          const data = await response.json();

        if (response.ok && data.status === 'success') {
          setUserProfile(data.data);
        } else {
          setNotification({
            open: true,
            title: 'ข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลโปรไฟล์',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
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

  const handleLogout = () => {
    logout();
    navigate('/member_login_machine');
  };

  if (isLoading) {
    return (
      <div className="user-dashboard-loading">
        <div className="user-dashboard-loader"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <UserSidebar userProfile={userProfile} onLogout={handleLogout} />

      <div className="user-dashboard-content">
        <div className="dashboard-header">
          <div className="header-greeting">
            <h1>ยินดีต้อนรับ, {userProfile?.fname} {userProfile?.lname}</h1>
            <p>ระบบจัดการแต้มจากการรีไซเคิลขวด</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Points Card */}
          <div className="dashboard-card points-card">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>{userProfile?.machine_type === 'money' ? 'ยอดเงินสะสม' : 'แต้มสะสม'}</h3>
              <p className="points-value">{userProfile?.point || 0}</p>
              <small>{userProfile?.machine_type === 'money' ? 'ยอดเงินที่คุณสะสมไว้' : 'แต้มที่คุณสะสมไว้'}</small>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card action-card">
            <h3>การทำรายการ</h3>
            <div className="quick-actions">

              <button
                className="action-btn redeem-btn"
                onClick={() => navigate('/member_redeem')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9h12M9 13h6M3 17h18"/>
                </svg>
                <span>{userProfile?.machine_type === 'money' ? 'แลกเงิน' : 'แลกแต้ม'}</span>
              </button>
              <button
                className="action-btn redeem-btn"
                onClick={() => navigate('/member_history')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
                <span>ประวัติการทำรายการ</span>
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="dashboard-card profile-card">
            <h3>ข้อมูลส่วนตัว</h3>
            <div className="profile-info-list">
              <div className="info-item">
                <span className="label">ชื่อ-นามสกุล</span>
                <span className="value">{userProfile?.fname} {userProfile?.lname}</span>
              </div>
              <div className="info-item">
                <span className="label">เบอร์โทรศัพท์</span>
                <span className="value">{userProfile?.phonenumber || 'ไม่ระบุ'}</span>
              </div>
              <div className="info-item">
                <span className="label">อายุ</span>
                <span className="value">{userProfile?.age || 'ไม่ระบุ'}</span>
              </div>
              <div className="info-item">
                <span className="label">เพศ</span>
                <span className="value">
                  {userProfile?.gender
                    ? (userProfile.gender.toLowerCase() === 'male'
                      ? 'ชาย'
                      : userProfile.gender.toLowerCase() === 'female'
                        ? 'หญิง'
                        : 'ไม่ระบุ')
                    : 'ไม่ระบุ'}
                </span>
              </div>
            </div>
            <button
              className="btn-edit-profile"
              onClick={() => navigate('/member_profile')}
            >
              ดูรายละเอียดเพิ่มเติม
            </button>
          </div>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.open}
        title={notification.title}
        description={notification.description}
        type={notification.type}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </div>
  );
};

export default MemberDashboard;

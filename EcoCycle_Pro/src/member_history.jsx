import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuthToken } from './context/AuthContext';
import UserSidebar from './components/member_sidebar';
import NotificationModal from './components/notification_modal';
import { apiUrl } from './lib/api';
import './css/member_history.css';

const MemberHistory = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const token = session?.token || getAuthToken();

  const [userProfile, setUserProfile] = useState(null);
  const [history, setHistory] = useState([]);
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

    const fetchData = async () => {
      try {
        // Fetch Profile to know machine_type
        const profileRes = await fetch(apiUrl('/api/user/me'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.status === 'success') {
          setUserProfile(profileData.data);
        } else {
          navigate('/member_login_machine');
          return;
        }

        // Fetch History
        const historyRes = await fetch(apiUrl('/api/user/history'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const historyData = await historyRes.json();
        if (historyRes.ok && historyData.status === 'success') {
          setHistory(historyData.data || []);
        } else {
          setNotification({
            open: true,
            title: 'ข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลประวัติได้',
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

    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/member_login_machine');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  if (isLoading) {
    return (
      <div className="user-dashboard-loading">
        <div className="user-dashboard-loader"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const isMoney = userProfile?.machine_type === 'money';
  const unit = isMoney ? 'บาท' : 'แต้ม';

  return (
    <div className="mh-container">
      <UserSidebar userProfile={userProfile} onLogout={handleLogout} />

      <div className="mh-content">
        <div className="mh-header">
          <h1>ประวัติการทำรายการ</h1>
          <p>ตรวจสอบประวัติการได้รับและการใช้{unit}ของคุณ</p>
        </div>

        <div className="mh-card">
          {history.length === 0 ? (
            <div className="mh-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>ยังไม่มีประวัติการทำรายการ</p>
            </div>
          ) : (
            <div className="mh-list">
              {history.map((log) => {
                const isEarn = parseFloat(log.point) > 0;
                return (
                  <div key={log.id} className="mh-item">
                    <div className="mh-item-left">
                      <div className={`mh-icon ${isEarn ? 'mh-earn' : 'mh-redeem'}`}>
                        {isEarn ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
                        )}
                      </div>
                      <div className="mh-details">
                        <span className="mh-title">{isEarn ? 'ฝากขวดรีไซเคิล' : 'แลกเปลี่ยน'}</span>
                        <span className="mh-date">{formatDate(log.createat)}</span>
                      </div>
                    </div>
                    <div className="mh-item-right">
                      <div className={`mh-amount ${isEarn ? 'mh-earn' : 'mh-redeem'}`}>
                        {isEarn ? '+' : ''}{parseFloat(log.point).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <span className="mh-unit">{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

export default MemberHistory;

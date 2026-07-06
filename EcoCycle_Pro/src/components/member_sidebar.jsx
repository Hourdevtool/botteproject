import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import NotificationModal from './notification_modal';
import '../css/member_sidebar.css';

const UserSidebar = ({ userProfile, onLogout }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    onLogout();
    navigate('/member_login_machine');
  };

  const userMenu = [
    {
      to: '/member_dashboard',
      label: 'แดชบอร์ด',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
        </svg>
      ),
    },

    {
      to: '/member_redeem',
      label: userProfile?.machine_type === 'money' ? 'แลกเงิน' : 'แลกแต้ม',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h12M9 13h6M3 17h18"/>
        </svg>
      ),
    },
    {
      to: '/member_profile',
      label: 'โปรไฟล์',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      to: '/member_history',
      label: 'ประวัติการทำรายการ',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      {isMobile && (
        <div className="mobile-user-header">
          <div className="mobile-user-meta">
            <div className="mobile-user-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="mobile-user-summary">
              <span className="mobile-user-name">{userProfile?.fname} {userProfile?.lname}</span>
              <strong className="mobile-user-points">{userProfile?.point || 0} แต้ม</strong>
            </div>
          </div>
          <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`user-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button className="sidebar-close" onClick={() => setIsOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className="user-sidebar-header">
          <div className="logo-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sidebar-logo-icon">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            <span className="sidebar-logo-text">EcoCycle</span>
          </div>
        </div>

        {/* User Profile
        <div className="user-sidebar-profile">
          <div className="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="user-profile-info">
            <h4>{userProfile?.fname} {userProfile?.lname}</h4>
            <p>{userProfile?.point || 0} แต้ม</p>
          </div>
        </div> */}

        {/* Navigation Menu */}
        <nav className="user-sidebar-nav">
          {userMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => isMobile && setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <button className="btn-logout" onClick={() => setShowLogoutConfirm(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <NotificationModal
        open={showLogoutConfirm}
        title="ยืนยันการออกจากระบบ"
        description="คุณต้องการออกจากระบบใช่หรือไม่?"
        variant="confirm"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default UserSidebar;

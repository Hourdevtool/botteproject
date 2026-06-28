import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../css/sidebar.css';
import { apiUrl } from '../lib/api';
import { getAuthToken, useAuth } from '../context/AuthContext';
import userIconImg from '../assets/Sample_User_Icon.png';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { session } = useAuth();
  const token = session?.token || getAuthToken();

  // ตรวจสอบขนาดหน้าจอแบบ Real-time
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false); // ถ้าขยายจอกลับไปเดสก์ท็อป ให้ปิดเมนูโมบายล์อัตโนมัติ
    };

    handleResize(); // รันครั้งแรก
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(apiUrl('/api/user/me'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          },
        });

        const payload = await response.json().catch(() => null);

        if (!isMounted) return;

        if (response.ok && payload?.status === 'success' && payload.data) {
          const nextUser = {
            role: payload.data.role === 'operator' ? 'operator' : 'admin',
            op_name: payload.data.op_name || payload.data.fname || 'ผู้ดูแลระบบส่วนกลาง',
            email: payload.data.email || '',
          };
          setUserInfo(nextUser);
        } else {
          setUserInfo(null);
        }
      } catch {
        if (isMounted) setUserInfo(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const role = userInfo?.role === 'operator' ? 'operator' : userInfo?.role === 'admin' ? 'admin' : null;
  const profileName = userInfo?.op_name || (role === 'operator' ? 'เจ้าของตู้' : 'ผู้ดูแลระบบส่วนกลาง');
  const profileSubtitle = userInfo?.email || 'ระบบจัดการทรัพยากรหมุนเวียน';
  const loadingPlaceholders = [0, 1, 2, 3];

  const adminMenu = [
    {
      to: '/overview',
      label: 'ภาพรวม',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
      ),
    },
    {
      to: '/analytics',
      label: 'การวิเคราะห์ข้อมูล',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 15v-4"/><path d="M12 15v-6"/><path d="M17 15v-2"/></svg>
      ),
    },
  ];

  const operatorMenu = [
    {
      to: '/my_machine',
      label: 'เจ้าของตู้',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      ),
    },
    {
      to: '/map',
      label: 'แผนที่',
      icon: (
        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
      ),
    },
  ];

  const menuItems = role === 'operator' ? operatorMenu : role === 'admin' ? adminMenu : [];
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <svg className="sidebar-logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 15.3l-3 3-3-3"/>
            <path d="M4 18.3V12a8 8 0 0 1 12.3-6.8"/>
            <path d="M17 8.7l3-3 3 3"/>
            <path d="M20 5.7V12a8 8 0 0 1-12.3 6.8"/>
          </svg>
          <span className="sidebar-logo-text">EcoCycle Pro</span>
        </div>
        <button className="mobile-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          )}
        </button>
      </div>

      {/* Backdrop (แสดงเฉพาะในโมบายล์เมื่อเปิดเมนู) */}
      {isMobile && isOpen && (
        <div className="sidebar-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}

      {/* Sidebar Layout */}
      <aside 
        className={`sidebar ${isOpen ? 'open' : ''}`} 
        aria-busy={isLoading} 
        aria-hidden={isMobile ? !isOpen : false}
      >
        <div className="sidebar-header desktop-only">
          <svg className="sidebar-logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 15.3l-3 3-3-3"/>
            <path d="M4 18.3V12a8 8 0 0 1 12.3-6.8"/>
            <path d="M17 8.7l3-3 3 3"/>
            <path d="M20 5.7V12a8 8 0 0 1-12.3 6.8"/>
          </svg>
          <span className="sidebar-logo-text">EcoCycle Pro</span>
        </div>

        <div className="sidebar-profile">
          {isLoading ? (
            <>
              <div className="sidebar-avatar skeleton-avatar" aria-hidden="true" />
              <div className="sidebar-profile-info loading-profile">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-subtitle" />
              </div>
            </>
          ) : (
            <>
              <img src={userIconImg} alt="Profile" className="sidebar-avatar" />
              <div className="sidebar-profile-info">
                <h4>{profileName}</h4>
                <p>{profileSubtitle}</p>
              </div>
            </>
          )}
        </div>

        <nav className="sidebar-nav">
          {isLoading
            ? loadingPlaceholders.map((item) => (
                <div key={item} className="nav-item nav-item-skeleton" aria-hidden="true">
                  <div className="skeleton-icon" />
                  <div className="skeleton-line skeleton-nav-line" />
                </div>
              ))
            : menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (isMobile) closeMenu();
                  }}
                  className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
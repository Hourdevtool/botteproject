import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuthToken } from './context/AuthContext';
import UserSidebar from './components/member_sidebar';
import NotificationModal from './components/notification_modal';
import { apiUrl } from './lib/api';
import './css/member_deposit.css';

const MemberDeposit = () => {
    const navigate = useNavigate();
    const { session, logout } = useAuth();
    const token = session?.token || getAuthToken();

    const [userProfile, setUserProfile] = useState(null);
    const [bottleType, setBottleType] = useState('clear');
    const [weight, setWeight] = useState('');
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
            navigate('/user_login_machine');
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
                    // Get machineId from session or localStorage
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    setMachineId(storedUser.machineId || '');
                } else {
                    navigate('/user_login_machine');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                navigate('/user_login_machine');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [token, navigate]);

    const handleDeposit = async (e) => {
        e.preventDefault();

        if (!weight || parseFloat(weight) <= 0) {
            setNotification({
                open: true,
                title: 'ข้อผิดพลาด',
                description: 'กรุณากรอกน้ำหนักขวดให้ถูกต้อง',
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

        setIsSubmitting(true);
        try {
            const response = await fetch(apiUrl(`/api/user/machines/${machineId}/deposit`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: bottleType,
                    weight: parseFloat(weight),
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                setNotification({
                    open: true,
                    title: 'สำเร็จ',
                    description: `รับขวดสำเร็จ! ได้แต้ม ${data.data.earned} แต้ม (รวมทั้งหมด: ${data.data.total_point} แต้ม)`,
                    type: 'success',
                });

                // Update user profile
                setUserProfile({
                    ...userProfile,
                    point: data.data.total_point,
                });

                // Reset form
                setWeight('');
                setBottleType('clear');

                // Redirect after 2 seconds
                setTimeout(() => {
                    navigate('/user_dashboard');
                }, 2000);
            } else {
                setNotification({
                    open: true,
                    title: 'ข้อผิดพลาด',
                    description: data.message || 'ไม่สามารถรับขวดได้',
                    type: 'error',
                });
            }
        } catch (err) {
            console.error('Deposit error:', err);
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

    const handleLogout = () => {
        logout();
        navigate('/user_login_machine');
    };

    if (isLoading) {
        return (
            <div className="user-deposit-loading">
                <div className="user-deposit-loader"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    return (
        <div className="user-deposit-container">
            <UserSidebar userProfile={userProfile} onLogout={handleLogout} />

            <div className="user-deposit-content">
                <div className="deposit-header">
                    <h1>หยอดขวด</h1>
                    <p>ส่งขวดเพื่อได้รับแต้ม</p>
                </div>

                <div className="deposit-card">
                    <div className="current-points">
                        <div className="points-display">
                            <span className="points-label">แต้มปัจจุบัน</span>
                            <span className="points-amount">{userProfile?.point || 0}</span>
                        </div>
                    </div>

                    <form className="deposit-form" onSubmit={handleDeposit}>
                        {/* Bottle Type Selection */}
                        <div className="user-deposit-form-group">
                            <label>ประเภทขวด</label>
                            <div className="bottle-type-selector">
                                {[
                                    { value: 'clear', label: 'ใส (Clear)', color: '#e8f5f2' },
                                    { value: 'opaque', label: 'ขุ่น (Opaque)', color: '#f5f0e8' },
                                    { value: 'brown', label: 'สีชา (Brown)', color: '#f0e8e0' },
                                ].map((type) => (
                                    <label key={type.value} className="bottle-option">
                                        <input
                                            type="radio"
                                            name="bottleType"
                                            value={type.value}
                                            checked={bottleType === type.value}
                                            onChange={(e) => setBottleType(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <span
                                            className="bottle-preview"
                                            style={{ backgroundColor: type.color }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 4h12v2H6zM8 6h8v10H8z" /><rect x="6" y="16" width="12" height="3" rx="1" />
                                            </svg>
                                        </span>
                                        <span className="bottle-label">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Weight Input */}
                        <div className="user-deposit-form-group">
                            <label>น้ำหนัก / ปริมาณ (กรัม)</label>
                            <div className="user-deposit-input-with-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 3v18M3 9h18M4 5h16v4H4z" /><rect x="8" y="14" width="8" height="5" rx="1" />
                                </svg>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="ระบุน้ำหนัก เช่น 1.5"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <small className="form-hint">
                                ระบบจะคำนวณแต้มโดยใช้สูตร: น้ำหนัก × อัตราแลกเปลี่ยนของตู้
                            </small>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-deposit"
                            disabled={isSubmitting || !weight}
                        >
                            {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งขวด'}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="deposit-info">
                        <h4>ข้อมูลประเภทขวด</h4>
                        <ul>
                            <li><strong>ใส (Clear):</strong> ขวดโปร่งใส</li>
                            <li><strong>ขุ่น (Opaque):</strong> ขวดไม่โปร่งใส</li>
                            <li><strong>สีชา (Brown):</strong> ขวดสีน้ำตาล</li>
                        </ul>
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

export default MemberDeposit;

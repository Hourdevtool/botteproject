import React from 'react';
import '../css/notification_modal.css';

const NotificationModal = ({
  open,
  title,
  description,
  variant = 'info',
  confirmLabel = 'ตกลง',
  cancelLabel = 'ยกเลิก',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!open) {
    return null;
  }

  const closeHandler = () => {
    if (!isLoading && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="popup-backdrop" role="presentation">
      <div className="popup-card" role="dialog" aria-modal="true" aria-labelledby="popup-title">
        
        {/* ปุ่ม X สำหรับปิดหน้าต่าง */}
        <button 
          type="button" 
          className="popup-close-btn" 
          onClick={closeHandler}
          disabled={isLoading}
          aria-label="ปิดหน้าต่าง"
        >
          &times;
        </button>

        <div className="popup-icon-wrap">
          <span className="popup-icon">{variant === 'confirm' ? '!' : '✓'}</span>
        </div>
        
        <h2 id="popup-title" className="popup-title">{title}</h2>
        <p className="popup-description">{description}</p>
        
        <div className="notification-popup-actions">
          {variant === 'confirm' ? (
            <button type="button" className="popup-btn popup-btn-secondary" onClick={closeHandler} disabled={isLoading}>
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="popup-btn popup-btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
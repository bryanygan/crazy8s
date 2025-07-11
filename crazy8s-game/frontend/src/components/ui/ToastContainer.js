import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemoveToast }) => {
  const safeToasts = toasts || [];
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2500,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '300px'
    }}>
      {safeToasts.map((toast, index) => (
        toast && toast.id ? (
          <Toast
            key={toast.id}
            toast={toast}
            index={index}
            onClose={() => onRemoveToast && onRemoveToast(toast.id)}
          />
        ) : null
      ))}
    </div>
  );
};

export default ToastContainer;
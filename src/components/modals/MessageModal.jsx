import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import './Modal.css';

const MessageModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green" size={24} />;
      case 'error': return <AlertCircle className="text-red" size={24} />;
      case 'info': return <Info className="text-primary" size={24} />;
      default: return <Info className="text-primary" size={24} />;
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getIcon()}
            <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', border: 'none' }}>
          <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default MessageModal;

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import './Modal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', type = 'danger' }) => {
  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle className={type === 'danger' ? 'text-red' : 'text-primary'} size={24} />
            <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ background: 'white', border: 'none' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button 
            className={type === 'danger' ? 'btn-danger' : 'btn-primary'} 
            onClick={onConfirm}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default ConfirmationModal;

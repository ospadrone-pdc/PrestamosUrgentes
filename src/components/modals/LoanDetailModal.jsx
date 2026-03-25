import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, FileText, Home, User, ArrowRight, History } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';
import { formatDate } from '../../utils/dateUtils';


const LoanDetailModal = ({ isOpen, onClose, loan }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && loan) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${API_URL}/loans/${loan.Id}/payments`);
          const data = await res.json();
          setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error fetching payments:', err);
        }
      };
      fetchHistory();
    }
  }, [isOpen, loan]);

  if (!isOpen || !loan) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Detalle de Operación - {loan.Id?.substring(0,8) || '---'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content">
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><User size={18} /> Cliente</h3>
              <p className="font-bold">{loan.ClientName}</p>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Préstamo activo desde {formatDate(loan.StartDate)}</p>

              
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}><DollarSign size={18} /> Condiciones</h3>
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="stat-item">
                  <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto</span>
                  <span className="value font-bold" style={{ fontSize: '1.25rem' }}>${(loan.Amount || 0).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasa Mensual</span>
                  <span className="value font-bold" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{loan.InterestRate}%</span>
                </div>
              </div>
            </div>

            <div className="section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Home size={18} /> Garantía Hipotecaria</h3>
              <p>{loan.PropertyDescription || 'Propiedad vinculada'}</p>
              <span className="status-badge light-blue">Garantía Activa</span>

              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}><History size={18} /> Historial de Pagos</h3>
              <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                {payments.length > 0 ? (
                  payments.map(p => (
                    <div key={p.Id} className="history-item" style={{ fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{formatDate(p.PaymentDate)}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.Type}</div>
                      </div>

                      <div className="text-green font-bold">+${p.Amount.toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.875rem' }}>No hay pagos registrados aún.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default LoanDetailModal;

import React from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const ClientDetailModal = ({ isOpen, onClose, client }) => {
  const [loans, setLoans] = React.useState([]);

  React.useEffect(() => {
    if (isOpen && client) {
      fetch(`${API_URL}/clients/${client.Id}/loans?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => setLoans(Array.isArray(data) ? data : []))
        .catch(err => console.error('Error fetching client loans:', err));
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2>Detalle de Cliente</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.Name}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content">
          <div className="client-info-grid">
            <div className="info-item">
              <label>Email</label>
              <div>{client.Email || 'No registrado'}</div>
            </div>
            <div className="info-item">
              <label>Teléfono</label>
              <div>{client.Phone || 'No registrado'}</div>
            </div>
            <div className="info-item" style={{ gridColumn: 'span 2' }}>
              <label>Dirección</label>
              <div>{client.Address || 'No registrada'}</div>
            </div>
          </div>

          <div className="loans-section" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Préstamos Asociados</h3>
            {loans.length > 0 ? (
              <div className="loan-mini-list">
                {loans.map(loan => (
                  <div key={loan.Id} className="loan-mini-item">
                    <div className="loan-header">
                      <span className={`status-badge small ${loan.Status === 'Active' ? 'green' : 'blue'}`}>
                        {loan.Status}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(loan.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="loan-body">
                      <div className="amount">${parseFloat(loan.Amount).toLocaleString()}</div>
                      <ArrowRight size={14} />
                      <div className="rate">{loan.InterestRate}% Mensual</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-mini">
                No hay préstamos registrados para este cliente.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        .client-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-sm);
        }
        .info-item label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
        }
        .info-item div {
          font-weight: 500;
          font-size: 0.9rem;
        }
        .loan-mini-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .loan-mini-item {
          padding: 0.75rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .loan-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .loan-body {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .empty-state-mini {
          padding: 2rem;
          text-align: center;
          background: #f8fafc;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.85rem;
        }
      `}</style>
    </div>,
    modalRoot
  );
};

export default ClientDetailModal;

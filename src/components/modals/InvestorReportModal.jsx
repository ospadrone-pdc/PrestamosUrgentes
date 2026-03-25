import React from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, Wallet, PieChart, Calendar, ArrowRight } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const InvestorReportModal = ({ isOpen, onClose, investor }) => {
  const [loans, setLoans] = React.useState([]);

  React.useEffect(() => {
    if (isOpen && investor) {
      const pId = investor.Id || investor.id;
      console.log('Fetching loans for partner:', pId, investor.Name);
      fetch(`${API_URL}/partners/${pId}/loans?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          console.log('Partner loans received:', data);
          setLoans(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error('Error fetching partner loans:', err));
    }
  }, [isOpen, investor]);

  if (!isOpen || !investor) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const stats = {
    totalInvested: investor.Balance || 0,
    activeLoans: loans.length,
    totalROI: investor.CommissionRate || 0,
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '600px' }}>
        <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <TrendingUp size={24} />
            <div>
              <h2 style={{ color: 'white' }}>Estado de Cuenta</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{investor.Name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ color: 'white' }}><X /></button>
        </div>

        <div className="modal-content" style={{ background: '#f8fafc' }}>
          <div className="report-grid">
            <div className="stat-mini-card">
              <label>Capital Actual</label>
              <div className="value">$ {stats.totalInvested.toLocaleString()}</div>
              <Wallet size={16} />
            </div>
            <div className="stat-mini-card">
              <label>Rendimiento Anual</label>
              <div className="value">{stats.totalROI}%</div>
              <PieChart size={16} />
            </div>
            <div className="stat-mini-card">
              <label>Préstamos Activos</label>
              <div className="value">{stats.activeLoans}</div>
              <Calendar size={16} />
            </div>
          </div>

          <div className="history-section" style={{ marginTop: '1.5rem' }}>
            <h3>Préstamos en los que participa</h3>
            {loans.length > 0 ? (
              <div className="loan-mini-list">
                {loans.map(loan => (
                  <div key={loan.Id} className="loan-mini-item">
                    <div className="loan-header">
                      <strong>{loan.ClientName}</strong>
                      <span className="status-badge small green">{loan.Status}</span>
                    </div>
                    <div className="loan-body">
                      <span>${parseFloat(loan.Amount).toLocaleString()}</span>
                      <ArrowRight size={14} />
                      <span>{loan.InterestRate}% Mensual</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-history">
                No hay préstamos activos vinculados a este inversionista todavía.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Cerrar Reporte
          </button>
        </div>
      </div>

      <style>{`
        .report-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .stat-mini-card {
          background: white;
          padding: 1rem;
          border-radius: var(--radius-sm);
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .stat-mini-card label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
        }
        .stat-mini-card .value {
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 0.25rem;
        }
        .stat-mini-card svg {
          position: absolute;
          top: 1rem;
          right: 1rem;
          color: var(--primary);
          opacity: 0.2;
        }
        .history-section h3 {
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          color: var(--text-main);
        }
        .empty-history {
          background: white;
          padding: 2rem;
          text-align: center;
          border-radius: var(--radius-sm);
          border: 1px dashed var(--border);
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .loan-mini-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .loan-mini-item {
          background: white;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .loan-mini-item .loan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .loan-mini-item .loan-body {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .status-badge.small {
          font-size: 0.65rem;
          padding: 0.1rem 0.5rem;
        }
      `}</style>
    </div>,
    modalRoot
  );
};

export default InvestorReportModal;

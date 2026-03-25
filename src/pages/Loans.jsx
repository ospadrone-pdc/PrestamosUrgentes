import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, FileText, Gavel, DollarSign } from 'lucide-react';
import LoanWizard from '../components/LoanWizard';
import PaymentModal from '../components/PaymentModal';
import LoanDetailModal from '../components/modals/LoanDetailModal';
import { loanService } from '../services/api';
import './Loans.css';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await loanService.getAll();
        setLoans(data);
      } catch (err) {
        console.error('Error fetching loans:', err);
      }
    };
    fetchLoans();
  }, []);

  const handleOpenPayment = (loan) => {
    setSelectedLoan(loan);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDetail = (loan) => {
    setSelectedLoan(loan);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="loans-view">
      <div className="page-header">
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar préstamo o cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <Filter size={18} />
            Filtros
          </button>
          <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
            <Plus size={18} />
            Nuevo Préstamo
          </button>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Tasa</th>
              <th>Saldo Pendiente</th>
              <th>Próximo Pago</th>
              <th>Semáforo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loans && loans.length > 0 ? (
              loans.filter(l => l.ClientName?.toLowerCase().includes(searchTerm.toLowerCase())).map((loan) => (
                <tr key={loan.Id}>
                  <td className="font-mono">{loan.Id?.substring(0, 8) || 'N/A'}</td>
                  <td className="font-bold">{loan.ClientName || 'Cliente desconocido'}</td>
                  <td>${(loan.Amount || 0).toLocaleString()}</td>
                  <td>{loan.InterestRate || 0}%</td>
                  <td>${(loan.Amount || 0).toLocaleString()}</td>
                  <td>{loan.NextPaymentDate || 'Sin fecha'}</td>
                  <td>
                    <span className={`status-badge light-${loan.Light?.toLowerCase() || 'green'}`}>
                      {loan.Status || 'Activo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button title="Registrar Pago" onClick={() => handleOpenPayment(loan)} className="text-primary">
                      <DollarSign size={18} />
                    </button>
                    <button title="Ver detalle" onClick={() => handleOpenDetail(loan)}><Eye size={18} /></button>
                    <button title="Historial" onClick={() => handleOpenDetail(loan)}><FileText size={18} /></button>
                    {loan.Light?.toLowerCase() === 'red' && (
                      <button title="Jurídico" className="text-red">
                        <Gavel size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay préstamos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LoanWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        loan={selectedLoan}
      />
      <LoanDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        loan={selectedLoan}
      />
    </div>
  );
};

export default Loans;

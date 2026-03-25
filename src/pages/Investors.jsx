import React, { useState, useEffect } from 'react';
import { Plus, Search, Wallet, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import './Catalogues.css';
import PartnerModal from '../components/modals/PartnerModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import InvestorReportModal from '../components/modals/InvestorReportModal';
import { API_URL } from '../config';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [investorToDelete, setInvestorToDelete] = useState(null);

  const fetchInvestors = async () => {
    try {
      const res = await fetch(`${API_URL}/partners?type=Investor&t=${Date.now()}`);
      const data = await res.json();
      setInvestors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching investors:', err);
    }
  };

  const handleDeleteClick = (id) => {
    setInvestorToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/partners/${investorToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInvestors();
        setIsConfirmOpen(false);
        setInvestorToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  const handleReportClick = (investor) => {
    setSelectedInvestor(investor);
    setIsReportOpen(true);
  };

  const handleEdit = (investor) => {
    setSelectedInvestor(investor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvestor(null);
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  return (
    <div className="catalogue-view">
      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar inversionista..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nuevo Inversionista
        </button>
      </div>

      <PartnerModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchInvestors}
        defaultType="Investor"
        initialData={selectedInvestor}
      />

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Inversionista"
        message="¿Estás completamente seguro de eliminar a este inversionista? Esta acción no se puede deshacer y podría afectar el historial de préstamos vinculados."
      />

      <InvestorReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        investor={selectedInvestor}
      />

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre / Razón Social</th>
              <th>Saldo Invertido</th>
              <th>Préstamos Activos</th>
              <th>ROI Promedio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {investors && investors.length > 0 ? (
              investors.filter(i => i.Name?.toLowerCase().includes(searchTerm.toLowerCase())).map((investor) => (
                <tr key={investor.Id}>
                  <td><span className="font-bold">{investor.Name || 'Sin Nombre'}</span></td>
                  <td>
                    <div className="info-row"><Wallet size={14} /> ${(investor.Balance || 0).toLocaleString()}</div>
                  </td>
                  <td>{investor.ActiveLoansCount || 0}</td>
                  <td>
                    <div className="info-row text-green"><TrendingUp size={14} /> {investor.CommissionRate || 0}%</div>
                  </td>
                  <td className="actions-cell">
                    <button title="Ver Reporte" onClick={() => handleReportClick(investor)}><TrendingUp size={18} /></button>
                    <button title="Editar" className="text-primary" onClick={() => handleEdit(investor)}><Edit2 size={18} /></button>
                    <button title="Eliminar" className="text-red" onClick={() => handleDeleteClick(investor.Id || investor.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay inversionistas registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Investors;

import React, { useState, useEffect } from 'react';
import { Gavel, Scale, FileText, AlertTriangle, Plus, Search } from 'lucide-react';
import './Legal.css';
import LegalModal from '../components/modals/LegalModal';

const Legal = () => {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchCases = async () => {
    try {
      const res = await fetch(`${API_URL}/legal?t=${Date.now()}`);
      const data = await res.json();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching legal cases:', err);
      setCases([]);
    }
  };

  const handleEdit = (c) => {
    setSelectedCase(c);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <div className="legal-view">
      {/* Pre-calculated stats or dummy for now */}
      <div className="legal-stats">
        <div className="card stat-mini">
          <div className="icon-circle bg-red-light"><Gavel size={20} /></div>
          <div>
            <span className="label">Casos Activos</span>
            <span className="value">{cases?.length || 0}</span>
          </div>
        </div>
        <div className="card stat-mini">
          <div className="icon-circle bg-yellow-light"><Scale size={20} /></div>
          <div>
            <span className="label">En Convenio</span>
            <span className="value">{cases.filter(c => c.Status === 'Convenio').length}</span>
          </div>
        </div>
        <div className="card stat-mini">
          <div className="icon-circle bg-blue-light"><FileText size={20} /></div>
          <div>
            <span className="label">Monto en Litigio</span>
            <span className="value">${((Array.isArray(cases) ? cases : []).reduce((acc, curr) => acc + (curr.LitigantAmount || 0), 0) / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar expediente o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Registrar Demanda
        </button>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Cliente</th>
              <th>Monto Litigado</th>
              <th>Estatus Judicial</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cases && cases.length > 0 ? (
              cases.filter(c => c.ClientName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.Expediente?.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                <tr key={item.Id}>
                  <td className="font-mono">{item.Expediente || 'N/A'}</td>
                  <td className="font-bold">{item.ClientName || 'Cliente desconocido'}</td>
                  <td>${(item.LitigantAmount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`legal-badge status-${(item.Status || 'default').toLowerCase().replace(/ /g, '-')}`}>
                      {item.Status || 'Sin estatus'}
                    </span>
                  </td>
                  <td className="text-muted small">{item.Notes || 'Sin notas'}</td>
                  <td className="actions-cell">
                    <button title="Ver Expediente"><FileText size={18} /></button>
                    <button title="Actualizar Estatus" className="text-primary" onClick={() => handleEdit(item)}><Scale size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay casos legales registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LegalModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchCases}
        initialData={selectedCase}
      />
    </div>
  );
};

export default Legal;

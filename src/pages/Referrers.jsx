import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Percent, Edit2, Trash2 } from 'lucide-react';
import './Catalogues.css';
import PartnerModal from '../components/modals/PartnerModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { API_URL } from '../config';

const Referrers = () => {
  const [referrers, setReferrers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [referrerToDelete, setReferrerToDelete] = useState(null);

  const fetchReferrers = async () => {
    try {
      const res = await fetch(`${API_URL}/partners?type=Referrer&t=${Date.now()}`);
      const data = await res.json();
      setReferrers(data);
    } catch (err) {
      console.error('Error fetching referrers:', err);
    }
  };

  const handleDeleteClick = (referrer) => {
    setReferrerToDelete(referrer);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!referrerToDelete) return;
    try {
      const res = await fetch(`${API_URL}/partners/${referrerToDelete.Id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchReferrers();
        setIsConfirmOpen(false);
        setReferrerToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  const handleEdit = (ref) => {
    setSelectedReferrer(ref);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setSelectedReferrer(null);
    setReferrerToDelete(null);
  };

  useEffect(() => {
    fetchReferrers();
  }, []);

  return (
    <div className="catalogue-view">
      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar referenciador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nuevo Referenciador
        </button>
      </div>

      <PartnerModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchReferrers}
        defaultType="Referrer"
        initialData={selectedReferrer}
      />

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre / Despacho</th>
              <th>Comisión Pactada</th>
              <th>Clientes Referidos</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {referrers && referrers.length > 0 ? (
              referrers.filter(r => r.Name?.toLowerCase().includes(searchTerm.toLowerCase())).map((ref) => (
                <tr key={ref.Id}>
                  <td><span className="font-bold">{ref.Name || 'Sin Nombre'}</span></td>
                  <td><div className="info-row"><Percent size={14} /> {ref.CommissionRate || 0}%</div></td>
                  <td><div className="info-row"><Users size={14} /> {ref.ReferredClientsCount || 0}</div></td>
                  <td>{ref.Phone || 'N/A'}</td>
                  <td className="actions-cell">
                    <button title="Historial"><Users size={18} /></button>
                    <button title="Editar" className="text-primary" onClick={() => handleEdit(ref)}><Edit2 size={18} /></button>
                    <button title="Eliminar" className="text-red" onClick={() => handleDeleteClick(ref)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay referenciadores registrados o cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={handleCloseModal}
        onConfirm={confirmDelete}
        title="Eliminar Referenciador"
        message={`¿Estás seguro de que deseas eliminar a ${referrerToDelete?.Name}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Referrers;

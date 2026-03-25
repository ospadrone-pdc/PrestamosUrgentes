import React, { useState, useEffect } from 'react';
import { Plus, Search, Home, User, DollarSign, Edit2, Trash2 } from 'lucide-react';
import './Catalogues.css';
import PropertyModal from '../components/modals/PropertyModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { API_URL } from '../config';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/properties?t=${Date.now()}`);
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleDeleteClick = (prop) => {
    setPropertyToDelete(prop);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      const res = await fetch(`${API_URL}/properties/${propertyToDelete.Id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProperties();
        setIsConfirmOpen(false);
        setPropertyToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const handleEdit = (prop) => {
    setSelectedProperty(prop);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setSelectedProperty(null);
    setPropertyToDelete(null);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="catalogue-view">
      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar propiedad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nueva Propiedad
        </button>
      </div>

      <PropertyModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchProperties}
        initialData={selectedProperty}
      />

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Propietario</th>
              <th>Descripción</th>
              <th>Valor Estimado</th>
              <th>Ubicación</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {properties && properties.length > 0 ? (
              properties.filter(p => p.Description?.toLowerCase().includes(searchTerm.toLowerCase())).map((prop) => (
                <tr key={prop.Id}>
                  <td><div className="info-row"><User size={14} /> {prop.OwnerName || 'Desconocido'}</div></td>
                  <td><span className="font-bold">{prop.Description || 'Sin descripción'}</span></td>
                  <td><div className="info-row"><DollarSign size={14} /> ${(prop.EstimatedValue || 0).toLocaleString()}</div></td>
                  <td>{prop.Location || 'No especificada'}</td>
                  <td>
                    <span className={`status-badge ${
                        prop.Status === 'Available' ? 'light-green' : 
                        prop.Status === 'Valuation' ? 'light-yellow' :
                        prop.Status === 'Active Guarantee' ? 'light-blue' :
                        prop.Status === 'Rejected' ? 'light-red' : 'light-gray'
                    }`}>
                      {prop.Status === 'Available' ? 'Disponible' : 
                       prop.Status === 'Valuation' ? 'En Valuación' :
                       prop.Status === 'Active Guarantee' ? 'Garantía Activa' :
                       prop.Status === 'Rejected' ? 'Rechazada' : 'Liberada'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button title="Ver Mapa"><Home size={18} /></button>
                    <button title="Editar" className="text-primary" onClick={() => handleEdit(prop)}><Edit2 size={18} /></button>
                    <button title="Eliminar" className="text-red" onClick={() => handleDeleteClick(prop)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay propiedades registradas o cargando...
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
        title="Eliminar Propiedad"
        message={`¿Estás seguro de que deseas eliminar la propiedad "${propertyToDelete?.Description}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Properties;

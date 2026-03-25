import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Edit2, Trash2, Eye } from 'lucide-react';
import './Catalogues.css';
import ClientModal from '../components/modals/ClientModal';
import ClientDetailModal from '../components/modals/ClientDetailModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { API_URL } from '../config';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/clients?t=${Date.now()}`);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      const res = await fetch(`${API_URL}/clients/${clientToDelete.Id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClients();
        setIsConfirmOpen(false);
        setClientToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDetailOpen(false);
    setIsConfirmOpen(false);
    setSelectedClient(null);
    setClientToDelete(null);
  };

  const handleVerPerfil = (client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="catalogue-view">
      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchClients}
        initialData={selectedClient}
      />

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Dirección</th>
              <th>Préstamos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients && clients.length > 0 ? (
              clients.filter(c => c.Name?.toLowerCase().includes(searchTerm.toLowerCase())).map((client) => (
                <tr key={client.Id}>
                  <td>
                    <div className="client-name-cell">
                      <div className="avatar-sm">{client.Name?.charAt(0) || '?'}</div>
                      <span className="font-bold">{client.Name || 'Sin Nombre'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="info-row"><Mail size={14} /> {client.Email || 'No rgistrado'}</div>
                      <div className="info-row"><Phone size={14} /> {client.Phone || 'No registrado'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="address-cell"><MapPin size={14} /> {client.Address || 'No registrado'}</div>
                  </td>
                  <td>{client.ActiveLoansCount || 0}</td>
                  <td className="actions-cell">
                    <button title="Ver Perfil" onClick={() => handleVerPerfil(client)}><Eye size={18} /></button>
                    <button title="Editar" className="text-primary" onClick={() => handleEdit(client)}><Edit2 size={18} /></button>
                    <button title="Eliminar" className="text-red" onClick={() => handleDeleteClick(client)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay clientes registrados o cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ClientDetailModal 
        isOpen={isDetailOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={handleCloseModal}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar a ${clientToDelete?.Name}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Clients;

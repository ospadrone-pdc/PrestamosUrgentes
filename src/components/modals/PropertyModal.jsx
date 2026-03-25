import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Home, MapPin, DollarSign, User, Save } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const PropertyModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    clientId: initialData?.ClientId || '',
    description: initialData?.Description || '',
    location: initialData?.Location || '',
    estimatedValue: initialData?.EstimatedValue || '',
    status: initialData?.Status || 'Available'
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/clients`)
        .then(res => res.json())
        .then(data => setClients(Array.isArray(data) ? data : []));
    }
    if (initialData) {
        setFormData({
            clientId: initialData.ClientId || '',
            description: initialData.Description || '',
            location: initialData.Location || '',
            estimatedValue: initialData.EstimatedValue || '',
            status: initialData.Status || 'Available'
        });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData?.Id 
        ? `${API_URL}/properties/${initialData.Id}`
        : `${API_URL}/properties`;
        
      const res = await fetch(url, {
        method: initialData?.Id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error saving property:', err);
    } finally {
      setLoading(false);
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card">
        <div className="modal-header">
          <h2>{initialData?.Id ? 'Editar Propiedad' : 'Nueva Propiedad (Garantía)'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Propietario (Cliente)</label>
              <div className="input-with-icon">
                <User size={18} />
                <select 
                  required 
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.Id} value={c.Id}>{c.Name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción de la Propiedad</label>
              <div className="input-with-icon">
                <Home size={18} />
                <input 
                  type="text" 
                  required 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                  placeholder="Ej: Departamento en Juriquilla, Casa en Centro"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ubicación / Dirección</label>
              <div className="input-with-icon">
                <MapPin size={18} />
                <input 
                  type="text" 
                  required 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value.toUpperCase()})}
                  placeholder="Calle, Número, Ciudad"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valor Estimado</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input 
                    type="number" 
                    required 
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Estatus</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Disponible p/ Garantía</option>
                  <option value="Valuation">En Valuación</option>
                  <option value="Active Guarantee">Garantía de Préstamo</option>
                  <option value="Rejected">Rechazada</option>
                  <option value="Released">Garantía Liberada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default PropertyModal;

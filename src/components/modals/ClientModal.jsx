import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, MapPin, Save } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const ClientModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.Name || '',
    email: initialData?.Email || '',
    phone: initialData?.Phone || '',
    address: initialData?.Address || '',
    notes: initialData?.Notes || ''
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.Name || '',
        email: initialData?.Email || '',
        phone: initialData?.Phone || '',
        address: initialData?.Address || '',
        notes: initialData?.Notes || ''
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData?.Id 
        ? `${API_URL}/clients/${initialData.Id}`
        : `${API_URL}/clients`;
      
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
      console.error('Error saving client:', err);
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
          <h2>{initialData?.Id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Nombre Completo</label>
              <div className="input-with-icon">
                <User size={18} />
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Correo Electrónico</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.toUpperCase()})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, phone: val});
                    }}
                    placeholder="Ej: 4421234567"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <div className="input-with-icon">
                <MapPin size={18} />
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})}
                  placeholder="Calle, Número, Colonia, Ciudad"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notas Adicionales</label>
              <textarea 
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value.toUpperCase()})}
                placeholder="Referencias personales, detalles laborales, etc."
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default ClientModal;

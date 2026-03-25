import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Briefcase, Phone, Mail, Percent, Save } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const PartnerModal = ({ isOpen, onClose, onSuccess, defaultType = 'Investor', initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.Name || '',
    type: initialData?.Type || defaultType,
    phone: initialData?.Phone || '',
    email: initialData?.Email || '',
    commissionRate: initialData?.CommissionRate || '',
    balance: initialData?.Balance || ''
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.Name || '',
          type: initialData.Type || defaultType,
          phone: initialData.Phone || '',
          email: initialData.Email || '',
          commissionRate: initialData.CommissionRate || '',
          balance: initialData.Balance || ''
        });
      } else {
          setFormData({
              name: '',
              type: defaultType,
              phone: '',
              email: '',
              commissionRate: '',
              balance: ''
            });
      }
    }
  }, [isOpen, initialData, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData?.Id 
        ? `${API_URL}/partners/${initialData.Id}`
        : `${API_URL}/partners`;

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
      console.error('Error saving partner:', err);
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
          <h2>{initialData?.Id ? 'Editar' : 'Nuevo'} {formData.type === 'Investor' ? 'Inversionista' : 'Referenciador'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Nombre / Razón Social</label>
              <div className="input-with-icon">
                <Briefcase size={18} />
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  placeholder="EJ: INVERSIONES GLOBALES S.A."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Socio</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Investor">Inversionista</option>
                  <option value="Referrer">Referenciador</option>
                </select>
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
              <label>Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toUpperCase()})}
                  placeholder="CORREO@EJEMPLO.COM"
                />
              </div>
            </div>

            {formData.type === 'Investor' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Saldo Inicial ($)</label>
                  <div className="input-with-icon">
                    <Save size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Comisión (%)</label>
                  <div className="input-with-icon">
                    <Percent size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Comisión Pactada (%)</label>
                <div className="input-with-icon">
                  <Percent size={18} />
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
            <p className="helper-text" style={{ marginTop: '0.5rem' }}>Rendimiento para inversionista o comisión para referenciador.</p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Socio'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default PartnerModal;

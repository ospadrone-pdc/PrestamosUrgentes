import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Gavel, User, FileText, Scale } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';
import MessageModal from './MessageModal';

const LegalModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [loans, setLoans] = useState([]);
  const [formData, setFormData] = useState({
    loanId: '',
    expediente: '',
    lawyer: '',
    notes: '',
    status: 'Demanda Presentada'
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ open: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          loanId: initialData.LoanId,
          expediente: initialData.Expediente || '',
          lawyer: initialData.Lawyer || '',
          notes: initialData.Notes || '',
          status: initialData.Status || 'Demanda Presentada'
        });
      } else {
        setFormData({
          loanId: '',
          expediente: '',
          lawyer: '',
          notes: '',
          status: 'Demanda Presentada'
        });
        const fetchLoans = async () => {
          try {
            const res = await fetch(`${API_URL}/loans`);
            const data = await res.json();
            setLoans(Array.isArray(data) ? data.filter(l => l.Status === 'Active') : []);
          } catch (err) {
            console.error('Error fetching loans:', err);
          }
        };
        fetchLoans();
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.loanId || !formData.expediente) {
      setMsg({ open: true, title: 'Atención', message: 'Selecciona un préstamo e ingresa el número de expediente.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const url = initialData 
        ? `${API_URL}/legal/${initialData.Id}`
        : `${API_URL}/legal`;
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMsg({ open: true, title: 'Éxito', message: initialData ? 'Expediente actualizado.' : 'Demanda registrada.', type: 'success' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setMsg({ open: true, title: 'Error', message: data.error || 'Operación fallida.', type: 'error' });
      }
    } catch (err) {
      setMsg({ open: true, title: 'Error de Red', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Gavel size={24} className="text-red" />
            <h2>{initialData ? 'Actualizar Expediente' : 'Registrar Nueva Demanda'}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Préstamo Judicializado</label>
              <div className="input-with-icon">
                <User size={18} />
                <select 
                  value={formData.loanId} 
                  onChange={(e) => setFormData({...formData, loanId: e.target.value})}
                  required
                  disabled={!!initialData}
                >
                  <option value="">{initialData ? initialData.ClientName : 'Buscar préstamo...'}</option>
                  {!initialData && loans.map(l => (
                    <option key={l.Id} value={l.Id}>
                      {l.ClientName} - ${(l.Amount || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Número de Expediente</label>
              <div className="input-with-icon">
                <FileText size={18} />
                <input 
                  type="text" 
                  placeholder="Ej. 123/2024"
                  value={formData.expediente}
                  onChange={(e) => setFormData({...formData, expediente: e.target.value})}
                  required
                  disabled={!!initialData}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estatus Judicial</label>
              <div className="input-with-icon">
                <Scale size={18} />
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Demanda Presentada">Demanda Presentada</option>
                  <option value="Emplazamiento">En Emplazamiento</option>
                  <option value="Contestación">Contestación de Demanda</option>
                  <option value="Pruebas">Desahogo de Pruebas</option>
                  <option value="Sentencia">En Sentencia</option>
                  <option value="Ejecución">Ejecución de Sentencia</option>
                  <option value="Convenio">Convenio Judicial</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Abogado Responsable</label>
              <input 
                type="text" 
                placeholder="Nombre del abogado o firma"
                value={formData.lawyer}
                onChange={(e) => setFormData({...formData, lawyer: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Notas de Seguimiento</label>
              <textarea 
                rows="3" 
                placeholder="Últimos avances del caso..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-danger" disabled={loading}>
              {loading ? 'Procesando...' : (initialData ? 'Actualizar Estatus' : 'Confirmar Demanda')}
            </button>
          </div>
        </form>
      </div>

      <MessageModal 
        isOpen={msg.open}
        onClose={() => setMsg({...msg, open: false})}
        title={msg.title}
        message={msg.message}
        type={msg.type}
      />
    </div>,
    modalRoot
  );
};

export default LegalModal;

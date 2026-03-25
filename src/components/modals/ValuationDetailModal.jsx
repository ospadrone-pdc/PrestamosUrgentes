import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, DollarSign, FileText, CheckCircle, AlertTriangle, Clock, ArrowRight, Save, MapPin } from 'lucide-react';
import './Modal.css';
import MessageModal from './MessageModal';
import { API_URL, BASE_URL } from '../../config';

const ValuationDetailModal = ({ isOpen, onClose, valuation, onSuccess }) => {
  const [dictum, setDictum] = useState({
    status: '',
    approvedAmount: '',
    centralNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ open: false, title: '', message: '', type: 'success' });

  React.useEffect(() => {
    if (isOpen && valuation) {
      setDictum({
        status: valuation.Status || 'Reviewing',
        approvedAmount: valuation.ApprovedAmount || '',
        centralNotes: valuation.CentralNotes || ''
      });

      // Auto-set status to Reviewing if it was Pending
      if (valuation.Status === 'Pending') {
        const autoReview = async () => {
          try {
            await fetch(`${API_URL}/valuations/${valuation.Id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Reviewing' })
            });
            onSuccess?.(); // Refresh list to show Reviewing state
          } catch (e) {
            console.error("Error auto-setting status to Reviewing:", e);
          }
        };
        autoReview();
      }
    }
  }, [isOpen, valuation]);

  if (!isOpen || !valuation) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const photos = (() => {
    try {
      if (!valuation.Photos) return [];
      const parsed = typeof valuation.Photos === 'string' ? JSON.parse(valuation.Photos) : valuation.Photos;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  })();

  const handleUpdate = async (forcedStatus) => {
    const finalStatus = forcedStatus || dictum.status;
    
    setLoading(true);
    try {
      const url = `${API_URL}/valuations/${valuation.Id}`;
      const payload = { ...dictum, status: finalStatus };
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMsg({ open: true, title: 'Éxito', message: 'Dictamen actualizado correctamente.', type: 'success' });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setMsg({ open: true, title: 'Error', message: data.error || 'No se pudo actualizar el dictamen.', type: 'error' });
      }
    } catch (err) {
      setMsg({ open: true, title: 'Error de Red', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FileText size={20} className="text-primary" />
            <div>
              <h2 style={{ marginBottom: '2px' }}>Detalles de Valuación</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solicitud #{valuation.Id?.substring(0, 8) || '---'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Side: Info and Photos */}
          <div className="valuation-info-section">
            <h3 className="section-title">Información General</h3>
            <div className="info-card-lite">
              <div className="item">
                <label>Propiedad</label>
                <span>{valuation.PropertyDesc}</span>
              </div>
              <div className="item">
                <label>Ubicación</label>
                <span>{valuation.PropertyLoc}</span>
              </div>
              <div className="item">
                <label>Cliente</label>
                <span>{valuation.ClientName}</span>
              </div>
              <div className="item">
                <label>Referenciador</label>
                <span>{valuation.ReferrerName}</span>
              </div>
              <div className="item">
                <label>Monto Sugerido</label>
                <span className="font-bold text-primary">${(parseFloat(valuation.RequestedAmount) || 0).toLocaleString()}</span>
              </div>
              {valuation.latitude && valuation.longitude && (
                <div className="item location-item">
                  <label>Ubicación GPS</label>
                  <div className="location-actions">
                    <span className="coords">{valuation.latitude}, {valuation.longitude}</span>
                    <a 
                      href={`https://www.google.com/maps?q=${valuation.latitude},${valuation.longitude}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-map-link"
                    >
                      <MapPin size={14} /> Ver en Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Evidencia (Fotos)</h3>
            <div className="photos-gallery">
              {photos.length > 0 ? photos.map((path, idx) => (
                <a key={idx} href={`${BASE_URL}${path}`} target="_blank" rel="noreferrer" className="photo-thumb">
                  <img src={`${BASE_URL}${path}`} alt={`Property evidence ${idx}`} />
                  <div className="overlay"><Camera size={16} /></div>
                </a>
              )) : (
                <div className="empty-photos">No se enviaron fotos.</div>
              )}
            </div>
          </div>

          {/* Right Side: Dictum Form */}
          <div className="dictum-section">
            <h3 className="section-title">Dictamen - Unidad Central</h3>
            <form onSubmit={handleUpdate} className="dictum-form shadow-sm">
              <div className="form-group">
                <label>Estatus del Proceso</label>
                <select 
                  value={dictum.status}
                  onChange={(e) => setDictum({...dictum, status: e.target.value})}
                  disabled={valuation.Status === 'Evaluated' || valuation.Status === 'Rejected'}
                >
                  <option value="Pending">Pendiente</option>
                  <option value="Reviewing">En Revisión</option>
                  <option value="Evaluated">Aprobado / Dictaminado</option>
                  <option value="Rejected">Rechazado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monto Autorizado de Préstamo</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={dictum.approvedAmount}
                    onChange={(e) => setDictum({...dictum, approvedAmount: e.target.value})}
                    disabled={valuation.Status === 'Evaluated' || valuation.Status === 'Rejected'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notas y Observaciones</label>
                <textarea 
                  rows="4" 
                  placeholder="Justificación del monto o motivo de rechazo..."
                  value={dictum.centralNotes}
                  onChange={(e) => setDictum({...dictum, centralNotes: e.target.value})}
                  disabled={valuation.Status === 'Evaluated' || valuation.Status === 'Rejected'}
                ></textarea>
              </div>

              {valuation.Status !== 'Evaluated' && valuation.Status !== 'Rejected' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn-danger" 
                      style={{ flex: 1, justifyContent: 'center' }} 
                      disabled={loading}
                      onClick={() => handleUpdate('Rejected')}
                    >
                      <AlertTriangle size={18} /> Rechazar
                    </button>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ flex: 1, justifyContent: 'center' }} 
                      disabled={loading || !dictum.approvedAmount}
                      onClick={() => handleUpdate('Evaluated')}
                    >
                      <CheckCircle size={18} /> Aprobar
                    </button>
                  </div>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center', background: '#f1f5f9' }} 
                    disabled={loading}
                    onClick={() => handleUpdate()}
                  >
                    <Save size={18} /> Guardar Avance
                  </button>
                </div>
              )}
              
              {(valuation.Status === 'Evaluated' || valuation.Status === 'Rejected') && (
                <div className="finalized-badge">
                  <CheckCircle size={16} /> Valuación Finalizada
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .section-title {
          font-size: 0.9rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          letter-spacing: 0.5px;
        }
        .info-card-lite {
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-sm);
          display: grid;
          gap: 0.75rem;
        }
        .info-card-lite .item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eef2f6;
        }
        .info-card-lite .item:last-child {
          border-bottom: none;
        }
        .location-item {
          flex-direction: column !important;
          gap: 0.5rem;
        }
        .location-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .coords {
          font-size: 0.75rem;
          color: #64748b;
          font-family: monospace;
        }
        .btn-map-link {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          background: #eff6ff;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .btn-map-link:hover {
          background: #dbeafe;
        }
        .info-card-lite label {
          color: var(--text-muted);
        }
        .photos-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        .photo-thumb {
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          border: 1px solid var(--border);
        }
        .photo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .photo-thumb .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.3);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: opacity 0.2s;
        }
        .photo-thumb:hover .overlay {
          opacity: 1;
        }
        .dictum-form {
          background: white;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .empty-photos {
          padding: 1.5rem;
          background: #f1f5f9;
          text-align: center;
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .finalized-badge {
          margin-top: 1rem;
          background: #ecfdf5;
          color: #059669;
          padding: 0.75rem;
          border-radius: 4px;
          text-align: center;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
      `}</style>
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

export default ValuationDetailModal;

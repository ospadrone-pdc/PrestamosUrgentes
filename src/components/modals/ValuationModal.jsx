import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, DollarSign, User, Home, Save, Upload, MapPin } from 'lucide-react';
import './Modal.css';
import { API_URL } from '../../config';

const ValuationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    referrerId: '',
    requestedAmount: '',
    latitude: '',
    longitude: ''
  });
  const [photos, setPhotos] = useState([]);
  const [properties, setProperties] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8)
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener la ubicación. Asegúrate de dar permisos de GPS.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch properties and referrers for the selects
      Promise.all([
        fetch(`${API_URL}/properties`).then(res => res.json()),
        fetch(`${API_URL}/partners?type=Referrer`).then(res => res.json())
      ]).then(([props, refs]) => {
        setProperties(Array.isArray(props) ? props : []);
        setReferrers(Array.isArray(refs) ? refs : []);
      });
    }
  }, [isOpen]);

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('propertyId', formData.propertyId);
    data.append('referrerId', formData.referrerId);
    data.append('requestedAmount', formData.requestedAmount);
    data.append('latitude', formData.latitude);
    data.append('longitude', formData.longitude);
    photos.forEach(photo => {
      data.append('photos', photo);
    });

    try {
      const res = await fetch(`${API_URL}/valuations`, {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error submitting valuation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card">
        <div className="modal-header">
          <h2>Nueva Solicitud de Valuación</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Propiedad a Valuar</label>
              <div className="input-with-icon">
                <Home size={18} />
                <select 
                  required 
                  value={formData.propertyId}
                  onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                >
                  <option value="">Seleccionar propiedad...</option>
                  {properties.map(p => (
                    <option key={p.Id} value={p.Id}>{p.Description} ({p.OwnerName})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Referenciador (Valuador)</label>
              <div className="input-with-icon">
                <User size={18} />
                <select 
                  required 
                  value={formData.referrerId}
                  onChange={(e) => setFormData({...formData, referrerId: e.target.value})}
                >
                  <option value="">Seleccionar referenciador...</option>
                  {referrers.map(r => (
                    <option key={r.Id} value={r.Id}>{r.Name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Monto Sugerido de Préstamo</label>
              <div className="input-with-icon">
                <DollarSign size={18} />
                <input 
                  type="number" 
                  required 
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({...formData, requestedAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ubicación GPS (Sitio)</label>
              <div className="location-capture-group">
                <div className="coordinates-display">
                  {formData.latitude ? (
                    <span>{formData.latitude}, {formData.longitude}</span>
                  ) : (
                    <span className="placeholder">Ubicación no capturada</span>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn-secondary btn-sm" 
                  onClick={captureLocation}
                  disabled={locationLoading}
                >
                  <MapPin size={16} /> {locationLoading ? 'Capturando...' : 'Capturar Ubicación'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Fotos de la Propiedad (Mínimo 1)</label>
              <div className="photo-upload-zone">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  id="photo-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-input" className="upload-placeholder">
                  <Camera size={32} />
                  <span>Haz clic para subir fotos o tomarlas con la cámara</span>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="photo-previews">
                  {photos.map((p, idx) => (
                    <div key={idx} className="photo-item">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading || photos.length === 0}>
              <Upload size={18} /> {loading ? 'Enviando...' : 'Enviar a Unidad Central'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .photo-upload-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .photo-upload-zone:hover {
          border-color: var(--primary);
        }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          cursor: pointer;
        }
        .photo-previews {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .photo-item {
          background: var(--bg-main);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid var(--border);
        }
        .location-capture-group {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .coordinates-display {
          flex: 1;
          padding: 0.625rem 0.875rem;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--text-main);
          border: 1px solid var(--border);
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        .coordinates-display .placeholder {
          color: #94a3b8;
          font-style: italic;
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          height: fit-content;
        }
      `}</style>
    </div>,
    modalRoot
  );
};

export default ValuationModal;

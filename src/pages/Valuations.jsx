import React, { useState, useEffect } from 'react';
import { Plus, Search, Camera, FileText, CheckCircle, Clock, AlertTriangle, User, TrendingUp, X } from 'lucide-react';
import './Catalogues.css';
import ValuationModal from '../components/modals/ValuationModal';
import ValuationDetailModal from '../components/modals/ValuationDetailModal';
import { API_URL } from '../config';

const Valuations = () => {
  const [valuations, setValuations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchValuations = async () => {
    try {
      const res = await fetch(`${API_URL}/valuations`);
      const data = await res.json();
      setValuations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching valuations:', err);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const handleDetailClick = (valuation) => {
    setSelectedValuation(valuation);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="status-badge light-yellow"><Clock size={12} /> Pendiente</span>;
      case 'Evaluated': return <span className="status-badge light-green"><CheckCircle size={12} /> Dictaminada</span>;
      case 'Rejected': return <span className="status-badge light-red"><AlertTriangle size={12} /> Rechazada</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const safeParsePhotos = (photosJson) => {
    try {
      if (!photosJson) return [];
      const parsed = typeof photosJson === 'string' ? JSON.parse(photosJson) : photosJson;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing photos:', e);
      return [];
    }
  };

  return (
    <div className="catalogue-view">
      <div className="page-header">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por propiedad o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nueva Valuación
        </button>
      </div>

      <ValuationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchValuations}
      />

      <ValuationDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        valuation={selectedValuation}
        onSuccess={fetchValuations}
      />

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Propiedad / Ubicación</th>
              <th>Solicitado por</th>
              <th>Monto Sugerido</th>
              <th>Monto Autorizado</th>
              <th>Estatus</th>
              <th>Fotos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {valuations && valuations.length > 0 ? (
              valuations.filter(v => 
                v.PropertyDesc?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                v.ClientName?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((v) => (
                <tr key={v.Id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="font-bold">{v.PropertyDesc}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.PropertyLoc}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-row"><User size={14} /> {v.ReferrerName}</div>
                  </td>
                  <td>${(v.RequestedAmount || 0).toLocaleString()}</td>
                  <td className={v.ApprovedAmount ? 'text-green font-bold' : ''}>
                    {v.ApprovedAmount ? `$${v.ApprovedAmount.toLocaleString()}` : '---'}
                  </td>
                  <td>
                    <div className="amazon-stepper">
                        <div className={`step-item ${['Pending', 'Reviewing', 'Evaluated', 'Rejected'].includes(v.Status) ? 'active' : ''}`}>
                          <div className="step-dot"><CheckCircle size={10} /></div>
                          <span className="step-label">Solicitado</span>
                        </div>
                        
                        <div className={`step-line ${['Reviewing', 'Evaluated', 'Rejected'].includes(v.Status) ? 'active' : ''}`}></div>
                        
                        <div className={`step-item ${['Reviewing', 'Evaluated', 'Rejected'].includes(v.Status) ? 'active' : ''}`}>
                          <div className="step-dot">{v.Status === 'Reviewing' ? <Clock size={10} /> : <CheckCircle size={10} />}</div>
                          <span className="step-label">En Revisión</span>
                        </div>
                        
                        <div className={`step-line ${v.Status === 'Evaluated' || v.Status === 'Rejected' ? 'active' : ''} ${v.Status === 'Rejected' ? 'rejected' : ''}`}></div>
                        
                        <div className={`step-item ${v.Status === 'Evaluated' || v.Status === 'Rejected' ? 'active' : ''} ${v.Status === 'Rejected' ? 'rejected' : ''}`}>
                          <div className="step-dot">
                            {v.Status === 'Rejected' ? <X size={10} /> : <TrendingUp size={10} />}
                          </div>
                          <span className="step-label">
                            {v.Status === 'Rejected' ? 'Rechazado' : 'Dictaminado'}
                          </span>
                        </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {safeParsePhotos(v.Photos).slice(0, 3).map((p, idx) => (
                        <div key={idx} className="photo-preview-sm" title={p} onClick={() => handleDetailClick(v)} style={{cursor: 'pointer'}}>
                           <Camera size={12} />
                        </div>
                      ))}
                      {safeParsePhotos(v.Photos).length === 0 && <span style={{fontSize: '0.7rem', color:'var(--text-muted)'}}>Sin fotos</span>}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button title="Ver Detalles" onClick={() => handleDetailClick(v)}><FileText size={18} /></button>
                    {v.Status !== 'Evaluated' && v.Status !== 'Rejected' && <button title="Dictaminar" className="text-primary" onClick={() => handleDetailClick(v)}><CheckCircle size={18} /></button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay solicitudes de valuación pendientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .photo-preview-sm {
          width: 24px;
          height: 24px;
          background: var(--bg-main);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border: 1px solid var(--border);
        }
        .amazon-stepper {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 8px 0;
          min-width: 200px;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 1;
        }
        .step-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #e2e8f0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .step-label {
          font-size: 9px;
          font-weight: 500;
          color: #94a3b8;
          white-space: nowrap;
        }
        .step-line {
          flex: 1;
          height: 2px;
          background: #e2e8f0;
          margin: 0 -4px;
          margin-top: -14px; /* Align with dots middle */
          z-index: 0;
        }
        .step-item.active .step-dot {
          background: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .step-item.active .step-label {
          color: var(--primary);
        }
        .step-line.active {
          background: var(--primary);
        }
        .step-item.rejected .step-dot {
          background: var(--status-red);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .step-item.rejected .step-label {
          color: var(--status-red);
        }
        .step-line.rejected {
          background: var(--status-red);
        }
        .step-item.active .step-dot svg {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Valuations;

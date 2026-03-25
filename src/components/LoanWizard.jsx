import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './LoanWizard.css';
import MessageModal from './modals/MessageModal';
import { API_URL } from '../config';

const LoanWizard = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    property: '',
    amount: '',
    interestRate: '',
    lateFeeRate: '',
    term: '',
    investors: [{ partnerId: '', percentage: 100 }]
  });
  const [msg, setMsg] = useState({ open: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsRes, propsRes, partnersRes] = await Promise.all([
            fetch(`${API_URL}/clients`),
            fetch(`${API_URL}/properties`),
            fetch(`${API_URL}/partners?type=Investor`)
          ]);
          const clientsData = await clientsRes.json();
          const propsData = await propsRes.json();
          const partnersData = await partnersRes.json();
          
          setClients(Array.isArray(clientsData) ? clientsData : []);
          setProperties(Array.isArray(propsData) ? propsData : []);
          setPartners(Array.isArray(partnersData) ? partnersData : []);
        } catch (err) {
          console.error('Error fetching wizard data:', err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateStep = () => {
    if (step === 1) {
      if (!formData.client || !formData.property) {
        setMsg({ open: true, title: 'Validación', message: 'Debes seleccionar un cliente y una propiedad.', type: 'error' });
        return false;
      }
    }
    if (step === 2) {
      const amount = parseFloat(formData.amount);
      const interest = parseFloat(formData.interestRate);
      const moratorio = parseFloat(formData.lateFeeRate);
      const term = parseInt(formData.term);
      
      if (!amount || amount <= 0) {
        setMsg({ open: true, title: 'Validación', message: 'El monto debe ser mayor a 0.', type: 'error' });
        return false;
      }
      if (isNaN(interest) || isNaN(moratorio) || isNaN(term)) {
        setMsg({ open: true, title: 'Validación', message: 'Tasa de interés, moratoria y plazo son campos obligatorios.', type: 'error' });
        return false;
      }
    }
    if (step === 3) {
      let totalPercent = 0;
      for (const inv of formData.investors) {
        if (!inv.partnerId) {
          setMsg({ open: true, title: 'Validación', message: 'Todos los slots de inversionista deben tener un socio seleccionado.', type: 'error' });
          return false;
        }
        const partner = partners.find(p => p.Id == inv.partnerId);
        const requiredAmount = (parseFloat(formData.amount) * parseFloat(inv.percentage)) / 100;
        
        if (requiredAmount > (partner?.Balance || 0)) {
          setMsg({ 
            open: true, 
            title: 'Fondos Insuficientes', 
            message: `El inversionista ${partner?.Name} no cuenta con fondos suficientes (Saldo: $${(partner?.Balance || 0).toLocaleString()}, Requerido: $${requiredAmount.toLocaleString()})`, 
            type: 'error' 
          });
          return false;
        }
        totalPercent += parseFloat(inv.percentage);
      }
      if (Math.abs(totalPercent - 100) > 0.01) {
        setMsg({ open: true, title: 'Validación', message: 'La suma de porcentajes debe ser exactamente 100%. Actualmente: ' + totalPercent + '%', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.client,
          propertyId: formData.property,
          amount: formData.amount,
          interestRate: formData.interestRate,
          lateFeeRate: formData.lateFeeRate,
          term: formData.term,
          investors: formData.investors
        })
      });
      if (res.ok) {
        setMsg({ open: true, title: 'Éxito', message: 'Originación completada con éxito.', type: 'success' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        const err = await res.json();
        setMsg({ open: true, title: 'Error', message: 'Error: ' + (err.error || 'No se pudo crear el préstamo.'), type: 'error' });
      }
    } catch (err) {
      console.error('Error confirming loan:', err);
      setMsg({ open: true, title: 'Error de Conexión', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="wizard-overlay">
      <div className="wizard-container card">
        <div className="wizard-header">
          <h2>Nueva Operación</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="wizard-steps">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Cliente</div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Condiciones</div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Inversionistas</div>
          <div className={`step-item ${step >= 4 ? 'active' : ''}`}>4. Revisión</div>
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="step-pane">
              <h3>Selección de Cliente y Garantía</h3>
              <div className="form-group">
                <label>Cliente</label>
                <select value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})}>
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.Id} value={c.Id}>{c.Name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Propiedad (Garantía)</label>
                <select 
                  value={formData.property} 
                  onChange={(e) => {
                    const p = properties.find(prop => prop.Id == e.target.value);
                    setFormData({
                      ...formData, 
                      property: e.target.value,
                      amount: p?.ValuatedAmount || ''
                    });
                  }}
                  disabled={!formData.client}
                >
                  <option value="">Seleccionar propiedad...</option>
                  {properties
                    .filter(p => p.ClientId == formData.client && p.ValuatedAmount > 0 && p.Status === 'Available')
                    .map(p => (
                      <option key={p.Id} value={p.Id}>
                        {p.Description} - Valuada: ${p.ValuatedAmount.toLocaleString()}
                      </option>
                  ))}
                </select>
                {formData.client && properties.filter(p => p.ClientId == formData.client && p.ValuatedAmount > 0 && p.Status === 'Available').length === 0 && (
                  <p className="helper-text error">Este cliente no tiene propiedades valuadas disponibles para garantía.</p>
                )}
                {!formData.client && <p className="helper-text error">Selecciona un cliente primero.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-pane">
              <h3>Condiciones Financieras</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Monto</label>
                  <input 
                    type="number" 
                    placeholder="$0.00" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Tasa Mensual (%)</label>
                  <input 
                    type="number" 
                    placeholder="0.00%" 
                    value={formData.interestRate}
                    onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Interés Moratorio (%)</label>
                  <input 
                    type="number" 
                    placeholder="0.00%" 
                    value={formData.lateFeeRate}
                    onChange={(e) => setFormData({...formData, lateFeeRate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Plazo (Meses)</label>
                  <input 
                    type="number" 
                    placeholder="12" 
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-pane">
              <h3>Asignación de Inversionistas</h3>
              <p className="helper-text">Define quién aporta el capital para este préstamo.</p>
              <div className="investor-list">
                {formData.investors.map((inv, idx) => (
                  <div key={idx} className="investor-row">
                    <select 
                      className="flex-1"
                      value={inv.partnerId}
                      onChange={(e) => {
                        const newInv = [...formData.investors];
                        newInv[idx].partnerId = e.target.value;
                        setFormData({...formData, investors: newInv});
                      }}
                    >
                      <option value="">Seleccionar Inversionista...</option>
                      {partners.map(p => (
                        <option key={p.Id} value={p.Id}>{p.Name}</option>
                      ))}
                    </select>
                    <div className="input-with-percent">
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-24" 
                        value={inv.percentage} 
                        onChange={(e) => {
                          const newInv = [...formData.investors];
                          newInv[idx].percentage = e.target.value;
                          setFormData({...formData, investors: newInv});
                        }}
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="btn-text" 
                onClick={() => setFormData({...formData, investors: [...formData.investors, { partnerId: '', percentage: 0 }]})}
              >
                + Agregar Inversionista
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="step-pane review-pane">
              <h3>Resumen de Originación</h3>
              <div className="review-summary">
                <div className="review-item"><span>Cliente:</span> <strong>{clients.find(c => c.Id == formData.client)?.Name || 'No seleccionado'}</strong></div>
                <div className="review-item"><span>Monto:</span> <strong>${(parseFloat(formData.amount) || 0).toLocaleString()}</strong></div>
                <div className="review-item"><span>Tasa:</span> <strong>{formData.interestRate || 0}% Mensual</strong></div>
                <div className="review-item"><span>Garantía:</span> <strong>{properties.find(p => p.Id == formData.property)?.Description || 'No seleccionada'}</strong></div>
                <div className="review-item"><span>Tope Valuación:</span> <strong className="text-green">${(properties.find(p => p.Id == formData.property)?.ValuatedAmount || 0).toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={prevStep}>
              <ChevronLeft size={18} /> Atrás
            </button>
          )}
          <div className="flex-1"></div>
          {step < 4 ? (
            <button className="btn-primary" onClick={nextStep}>
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-primary btn-success" onClick={handleConfirm} disabled={loading}>
              <Check size={18} /> {loading ? 'Originando...' : 'Confirmar Originación'}
            </button>
          )}
        </div>
      </div>
      <MessageModal 
        isOpen={msg.open}
        onClose={() => setMsg({ ...msg, open: false })}
        title={msg.title}
        message={msg.message}
        type={msg.type}
      />
    </div>,
    modalRoot
  );
};

export default LoanWizard;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, CreditCard } from 'lucide-react';
import './PaymentModal.css';
import MessageModal from './modals/MessageModal';
import { API_URL } from '../config';

const PaymentModal = ({ isOpen, onClose, loan }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Mensualidad'
  });
  const [msg, setMsg] = useState({ open: false, title: '', message: '', type: 'success' });

  if (!isOpen || !loan) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const currentBalance = parseFloat(loan.Balance || loan.Amount || 0);
  const interestDue = (currentBalance * (loan.InterestRate / 100));
  const amountPaid = parseFloat(formData.amount) || 0;
  const capitalAbono = Math.max(0, amountPaid - interestDue);


  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMsg({ open: true, title: 'Atención', message: 'Por favor ingrese un monto válido.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: loan.Id,
          amount: amountPaid,
          type: formData.type,
          date: formData.date,
          appliedInterest: formData.type === 'Interés' || formData.type === 'Mensualidad' ? Math.min(amountPaid, interestDue) : 0,
          appliedCapital: formData.type === 'Capital' ? amountPaid : (formData.type === 'Mensualidad' ? capitalAbono : 0)
        })
      });

      if (res.ok) {
        setMsg({ open: true, title: 'Éxito', message: 'Pago registrado con éxito.', type: 'success' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        const err = await res.json();
        setMsg({ open: true, title: 'Error', message: 'Error al registrar pago: ' + (err.error || 'Desconocido'), type: 'error' });
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setMsg({ open: true, title: 'Error de Conexión', message: err.message, type: 'error' });
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container card">
        <div className="modal-header">
          <h2>Registrar Pago - {loan.ClientName || 'Cliente'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-content">
          <div className="loan-info-bar">
            <div className="info-item">
              <span className="label">Saldo Actual</span>
              <span className="value font-bold text-primary">${(currentBalance).toLocaleString()}</span>
            </div>

            <div className="info-item">
              <span className="label">Tasa</span>
              <span className="value">{loan.InterestRate}%</span>
            </div>
          </div>

          <div className="form-group">
            <label>Monto del Pago</label>
            <div className="input-with-icon">
              <DollarSign size={18} />
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de Pago</label>
            <div className="input-with-icon">
              <Calendar size={18} />
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Concepto / Tipo</label>
            <div className="input-with-icon">
              <CreditCard size={18} />
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Mensualidad">Mensualidad (Interés + Capital)</option>
                <option value="Interés">Solo Interés</option>
                <option value="Capital">Abono a Capital</option>
                <option value="Moratorio">Interés Moratorio</option>
              </select>
            </div>
          </div>

          <div className="allocation-preview">
            <h3>Distribución Automática</h3>
            <div className="allocation-row">
              <span>Interés Ordinario ({loan.InterestRate}%)</span>
              <strong>${interestDue.toLocaleString()}</strong>
            </div>
            <div className="allocation-row">
              <span>Abono a Capital</span>
              <strong>${capitalAbono.toLocaleString()}</strong>
            </div>
            <div className="allocation-total">
              <span>Total Aplicado</span>
              <strong>${amountPaid.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Registrar Pago</button>
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

export default PaymentModal;

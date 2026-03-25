import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { healthService } from '../services/api';
import { Shield, Percent, Activity, Building, Server } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [health, setHealth] = useState({ loading: true, status: null });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealth({ loading: true, status: null });
    try {
      const data = await healthService.getHealth();
      setHealth({ loading: false, status: data });
    } catch (err) {
      setHealth({ loading: false, status: { error: true, message: err.message } });
    }
  };

  return (
    <Layout title="Configuración del Sistema">
      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Building size={18} />
            <span>General</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
          >
            <Percent size={18} />
            <span>Finanzas</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            <span>Seguridad</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            <Activity size={18} />
            <span>Estado del Sistema</span>
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>Información General</h3>
              <div className="settings-card">
                <div className="form-group">
                  <label>Nombre de la Empresa</label>
                  <input type="text" defaultValue="Préstamos Urgentes S.A. de C.V." />
                </div>
                <div className="form-group">
                  <label>Versión del Software</label>
                  <input type="text" readOnly value="1.2.0 (PostgreSQL Edition)" />
                </div>
                <div className="form-group">
                  <label>Créditos</label>
                  <p className="helper-text">Desarrollado por NuvexLabs © 2026</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="settings-section">
              <h3>Parámetros Financieros</h3>
              <div className="settings-card">
                <div className="form-group">
                  <label>Tasa de Interés Ordinaria Default (%)</label>
                  <input type="number" defaultValue="5.0" step="0.5" />
                </div>
                <div className="form-group">
                  <label>Tasa Interest Moratoria Default (%)</label>
                  <input type="number" defaultValue="10.0" step="0.5" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="settings-section">
              <h3>Diagnóstico</h3>
              <div className="settings-card">
                <div className="status-item">
                  <div className="status-label">
                    <Server size={18} />
                    <span>Conexión con Servidor API</span>
                  </div>
                  <div className={`status-indicator ${health.loading ? 'loading' : health.status?.error ? 'error' : 'ok'}`}>
                    {health.loading ? 'Verificando...' : health.status?.error ? 'Desconectado' : 'Conectado'}
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">
                    <Activity size={18} />
                    <span>Conexión con Base de Datos (Render)</span>
                  </div>
                  <div className={`status-indicator ${health.loading ? 'loading' : health.status?.db ? 'ok' : 'error'}`}>
                    {health.loading ? 'Verificando...' : health.status?.db ? 'Activa' : 'Error'}
                  </div>
                </div>
                <button className="btn-refresh" onClick={checkHealth} disabled={health.loading}>
                  Re-validar Conexiones
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Seguridad</h3>
              <div className="settings-card">
                <p className="helper-text">Las opciones de gestión de usuarios y roles estarán disponibles en la próxima actualización.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

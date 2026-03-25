import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { dashboardService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    activeClients: 0,
    riskyLoans: 0,
    monthlyCollection: 0,
    collectionHistory: [],
    portfolioDistribution: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        console.log('Dashboard: Fetching stats...');
        const data = await dashboardService.getStats();
        console.log('Dashboard: Received stats:', data);
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <span className="ml-3 text-gray-500 font-medium">Cargando datos del sistema...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-view">

      <div className="stats-grid">
        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-blue"><TrendingUp size={20} /></div>
            <span className="kpi-label">Cartera Total</span>
          </div>
          <div className="kpi-value">${(stats?.totalPortfolio || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="trend positive">Actualizado hoy</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-green"><CheckCircle2 size={20} /></div>
            <span className="kpi-label">Cobranza del Mes</span>
          </div>
          <div className="kpi-value">${(stats?.monthlyCollection || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="trend positive">Actualizado hoy</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-yellow"><Users size={20} /></div>
            <span className="kpi-label">Clientes Activos</span>
          </div>
          <div className="kpi-value">{stats?.activeClients || 0}</div>
          <div className="kpi-footer">
            <span className="trend">Total en sistema</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-red"><AlertCircle size={20} /></div>
            <span className="kpi-label">Préstamos en Riesgo</span>
          </div>
          <div className="kpi-value">{stats?.riskyLoans || 0}</div>
          <div className="kpi-footer">
            <span className="trend negative">Acción requerida</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Cobranza Mensual ({new Date().getFullYear()})</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.collectionHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="monto" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3>Distribución de Cartera</h3>
          <div className="chart-container flex items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.portfolioDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.portfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {stats.portfolioDistribution.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="dot" style={{backgroundColor: item.color}}></span>
                  <span className="label">{item.name}</span>
                  <span className="value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

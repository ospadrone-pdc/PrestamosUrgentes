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
import { TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dashboardService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    activeClients: 0,
    riskyLoans: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  const dataCollection = [
    { name: 'Ene', monto: 450000 },
    { name: 'Feb', monto: 520000 },
    { name: 'Mar', monto: 480000 },
    { name: 'Abr', monto: 610000 },
    { name: 'May', monto: 550000 },
    { name: 'Jun', monto: 670000 },
  ];

  const dataPortfolio = [
    { name: 'Sana', value: 75, color: '#10b981' },
    { name: 'Riesgo', value: 15, color: '#f59e0b' },
    { name: 'Vencida', value: 10, color: '#ef4444' },
  ];

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
            <span className="trend positive">+8.4% vs mes anterior</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-green"><CheckCircle2 size={20} /></div>
            <span className="kpi-label">Cobranza del Mes</span>
          </div>
          <div className="kpi-value">$845,200</div>
          <div className="kpi-footer">
            <span className="trend positive">92% de la meta</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon bg-yellow"><Users size={20} /></div>
            <span className="kpi-label">Clientes Activos</span>
          </div>
          <div className="kpi-value">{stats?.activeClients || 0}</div>
          <div className="kpi-footer">
            <span className="trend">12 nuevos este mes</span>
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
          <h3>Cobranza Mensual (2024)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCollection}>
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
                  data={dataPortfolio}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataPortfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {dataPortfolio.map((item) => (
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

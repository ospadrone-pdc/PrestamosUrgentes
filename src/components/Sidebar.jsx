import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HandCoins, 
  Users, 
  Home, 
  Briefcase, 
  Gavel, 
  UsersRound,
  Settings,
  Camera
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Inversionistas', icon: <Briefcase size={20} />, path: '/investors' },
    { name: 'Clientes', icon: <Users size={20} />, path: '/clients' },
    { name: 'Propiedades', icon: <Home size={20} />, path: '/properties' },
    { name: 'Préstamos', icon: <HandCoins size={20} />, path: '/loans' },
    { name: 'Jurídico', icon: <Gavel size={20} />, path: '/legal' },
    { name: 'Referenciadores', icon: <UsersRound size={20} />, path: '/referrers' },
    { name: 'Valuaciones', icon: <Camera size={20} />, path: '/valuations' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">PU</div>
        <span className="logo-text">Préstamos<span>Urgentes</span></span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings size={20} />
          <span>Configuración</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import './Topbar.css';

const Topbar = ({ title }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Buscar..." />
        </div>
        <button className="icon-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Administrador</span>
            <span className="user-role">Dirección General</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

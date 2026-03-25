import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';


const Layout = ({ children, title }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`layout-root ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="content-area">
          {children}
        </main>
        <footer className="layout-footer">
          PRESTAMOS URGENTES &middot; {new Date().getFullYear()} &middot; BY NUVEXLABS
        </footer>
      </div>
    </div>
  );
};


export default Layout;

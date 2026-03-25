import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

const Layout = ({ children, title }) => {
  return (
    <div className="layout-root">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar title={title} />
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

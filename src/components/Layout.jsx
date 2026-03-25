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
      </div>
    </div>
  );
};

export default Layout;

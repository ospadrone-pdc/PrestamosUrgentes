import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Clients from './pages/Clients';
import Properties from './pages/Properties';
import Investors from './pages/Investors';
import Referrers from './pages/Referrers';
import Legal from './pages/Legal';
import Valuations from './pages/Valuations';
const Settings = () => <Layout title="Configuración"><div>Configuración del Sistema</div></Layout>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout title="Dashboard Ejecutivo"><Dashboard /></Layout>} />
        <Route path="/loans" element={<Layout title="Préstamos"><Loans /></Layout>} />
        <Route path="/clients" element={<Layout title="Gestión de Clientes"><Clients /></Layout>} />
        <Route path="/properties" element={<Layout title="Catálogo de Propiedades"><Properties /></Layout>} />
        <Route path="/investors" element={<Layout title="Panel de Inversionistas"><Investors /></Layout>} />
        <Route path="/referrers" element={<Layout title="Red de Referenciadores"><Referrers /></Layout>} />
        <Route path="/legal" element={<Layout title="Seguimiento Jurídico"><Legal /></Layout>} />
        <Route path="/valuations" element={<Layout title="Valuaciones de Propiedades"><Valuations /></Layout>} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;

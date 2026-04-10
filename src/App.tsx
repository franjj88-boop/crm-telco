import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BuscadorPage } from './pages/BuscadorPage'
import { ClienteLayout } from './components/layout/ClienteLayout'
import { HomePage } from './pages/cliente/HomePage'
import { FacturacionPage } from './pages/cliente/FacturacionPage'
import { ReclamacionesPage } from './pages/cliente/ReclamacionesPage'
import { AveriasPage } from './pages/cliente/AveriasPage'
import { PedidosPage } from './pages/cliente/PedidosPage'
import { CobrosPage } from './pages/cliente/CobrosPage'
import { VentaPage } from './pages/cliente/VentaPage'
import { DispositivosPage } from './pages/cliente/DispositivosPage'
import { RetencionPage } from './pages/cliente/RetencionPage'
import { ProductoDetallePage } from './pages/cliente/ProductoDetallePage'
import { ConsumosPage } from './pages/cliente/ConsumosPage'
import { NuevaVentaPage } from './pages/venta/NuevaVentaPage'

const PASSWORD = 'telco2026'

function useAuth() {
  const [ok, setOk] = useState(() => sessionStorage.getItem('auth') === PASSWORD)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const intentar = () => {
    if (input === PASSWORD) { sessionStorage.setItem('auth', PASSWORD); setOk(true) }
    else { setError(true); setTimeout(() => setError(false), 2000) }
  }
  return { ok, input, setInput, intentar, error }
}

export default function App() {
  const { ok, input, setInput, intentar, error } = useAuth()

  if (!ok) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F5F7', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: 340, textAlign: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0052CC', margin: '0 auto 20px', display: 'inline-block' }} />
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#111827' }}>CRM Telco</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>Introduce la contraseña para acceder</div>
        <input
          type="password"
          placeholder="Contraseña"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && intentar()}
          style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${error ? '#E74C3C' : '#D1D5DB'}`, borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' }}
          autoFocus
        />
        {error && <div style={{ fontSize: 12, color: '#E74C3C', marginBottom: 10, marginTop: -6 }}>Contraseña incorrecta</div>}
        <button
          onClick={intentar}
          style={{ width: '100%', padding: '11px', background: '#0052CC', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Acceder
        </button>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BuscadorPage />} />
        <Route path="/nueva-venta" element={<NuevaVentaPage />} />
        <Route path="/cliente/:id" element={<ClienteLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="facturas" element={<FacturacionPage />} />
          <Route path="reclamaciones" element={<ReclamacionesPage />} />
          <Route path="averias" element={<AveriasPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="cobros" element={<CobrosPage />} />
          <Route path="venta" element={<VentaPage />} />
          <Route path="dispositivos" element={<DispositivosPage />} />
          <Route path="retencion" element={<RetencionPage />} />
          <Route path="consumos" element={<ConsumosPage />} />
          <Route path="producto/:productoId" element={<ProductoDetallePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
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

export default function App() {
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
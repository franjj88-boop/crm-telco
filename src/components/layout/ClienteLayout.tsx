import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { datosCliente, consumosPorCliente } from '../../data/mockData'

function formatTiempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0')
  const s = (seg % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ClienteLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    clienteActivo, setClienteActivo,
    canalActual, setCanalActual,
    tiempoLlamada, llamadaActiva, iniciarLlamada, finalizarLlamada,
    notas, setNotas,
    moduloActivo, setModuloActivo,
    notificaciones, addNotificacion,
  } = useAppStore()

  const [mostrarNotas, setMostrarNotas] = useState(false)
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [ivrAbierto, setIvrAbierto] = useState(true)
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [cierreMotivo, setCierreMotivo] = useState('')
  const [cierreMotivoCode, setCierreMotivoCode] = useState<{ motivo: string; submotivo: string } | null>(null)
  const [cierreResuelto, setCierreResuelto] = useState<boolean | null>(null)
  const [cierreCerrando, setCierreCerrando] = useState(false)

  useEffect(() => {
    if (id && datosCliente[id]) {
      setClienteActivo(datosCliente[id])
      if (!llamadaActiva) iniciarLlamada()
    }
  }, [id])

  useEffect(() => {
    const seg = location.pathname.split('/').pop() || 'home'
    setModuloActivo(seg)
  }, [location])

  useEffect(() => {
    if (tiempoLlamada === 60) {
      addNotificacion({ tipo: 'warn', titulo: 'Recordatorio', mensaje: 'Llevas 1 minuto en llamada.' })
    }
    if (tiempoLlamada === 120 && clienteActivo?.id === 'CRM-002') {
      addNotificacion({ tipo: 'ok', titulo: 'Masiva resuelta', mensaje: 'INC-2026-0089 — Fibra zona Castellana Norte restaurada.' })
    }
  }, [tiempoLlamada])

  const cliente = clienteActivo
  if (!cliente) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
      Cargando...
    </div>
  )

  const esCritico = cliente.satisfaccionRiesgo === 'critico'
  const esEnRiesgo = cliente.satisfaccionRiesgo === 'en_riesgo'
  const tieneDeuda = cliente.cobros.deudaTotal > 0
  const tieneAveria = cliente.averias.some(a => a.estado !== 'resuelta')
  const tieneReclamacion = cliente.reclamaciones.some(r => r.estado === 'abierta' || r.estado === 'en_gestion')
  const tienePedido = cliente.pedidos.some(p => p.estado !== 'completado' && p.estado !== 'cancelado')
  const notifNoLeidas = notificaciones.filter(n => !n.leida).length

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'facturas', label: 'Facturas', badge: cliente.facturas.filter(f => f.estado === 'vencida').length },
    { id: 'reclamaciones', label: 'Reclamaciones', badge: cliente.reclamaciones.filter(r => r.estado !== 'resuelta').length },
    { id: 'averias', label: 'Averías', badge: cliente.averias.filter(a => a.estado !== 'resuelta').length },
    { id: 'pedidos', label: 'Pedidos', badge: cliente.pedidos.filter(p => p.estado !== 'completado' && p.estado !== 'cancelado').length },
    { id: 'cobros', label: 'Cobros', badge: tieneDeuda ? 1 : 0 },
    { id: 'venta', label: 'Venta' },
    { id: 'dispositivos', label: 'Dispositivos' },
    { id: 'retencion', label: 'Retención' },
    { id: 'consumos', label: '📊 Consumos' },
  ]

  const reclamacionesActivas = cliente.reclamaciones.filter(r => r.estado !== 'resuelta')
  const reclamacionBloquea = cliente.reclamaciones.find(r => r.bloquea && r.estado !== 'resuelta')
  const averiaPrincipal = cliente.averias.find(a => a.estado !== 'resuelta')
  const pedidoPrincipal = cliente.pedidos.find(p => p.estado !== 'completado' && p.estado !== 'cancelado')

  const alertas = [
    tieneDeuda && {
      tipo: 'err' as const,
      icono: '💳',
      texto: `Deuda ${cliente.cobros.deudaTotal.toFixed(2)}€`,
      subtexto: cliente.cobros.estadoGeneral === 'vencida' ? 'Vencida' : 'En plazo',
      ruta: 'cobros'
    },
    reclamacionBloquea && {
      tipo: 'err' as const,
      icono: '🔒',
      texto: `${reclamacionBloquea.numero}`,
      subtexto: 'Bloquea cobro',
      ruta: 'reclamaciones'
    },
    tieneAveria && {
      tipo: 'err' as const,
      icono: '🔧',
      texto: averiaPrincipal?.estado === 'bloqueada_impago' ? 'Avería bloqueada' : 'Avería activa',
      subtexto: averiaPrincipal?.sintoma?.slice(0, 28) + '...' || '',
      ruta: 'averias'
    },
    tieneReclamacion && !reclamacionBloquea && {
      tipo: 'warn' as const,
      icono: '⚠',
      texto: `${reclamacionesActivas.length} reclamación/es`,
      subtexto: reclamacionesActivas[0]?.motivo?.slice(0, 28) + '...' || '',
      ruta: 'reclamaciones'
    },
    tienePedido && {
      tipo: 'blue' as const,
      icono: '📦',
      texto: pedidoPrincipal?.numero || 'Pedido activo',
      subtexto: pedidoPrincipal?.proximoHito || '',
      ruta: 'pedidos'
    },
  ].filter(Boolean) as { tipo: 'err' | 'warn' | 'blue'; icono: string; texto: string; subtexto: string; ruta: string }[]

  const alertaColor = (tipo: 'err' | 'warn' | 'blue') => ({
    err: { bg: 'var(--color-red-light)', border: 'var(--color-red-border)', color: 'var(--color-red-dark)', dot: 'status-dot-err' },
    warn: { bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', color: 'var(--color-amber-dark)', dot: 'status-dot-warn' },
    blue: { bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', color: 'var(--color-blue-dark)', dot: 'status-dot-blue' },
  }[tipo])

  // Info TV del cliente
  const getTVInfo = () => {
    const tvProducto = cliente.productos.find(p => p.tipo === 'tv')
    if (!tvProducto) return null
    // Extraer canales del nombre o del parque
    const addonsTV = ['Fútbol', 'Ficción', 'Netflix', 'Disney+', 'Total']
    const canalesActivos = addonsTV.filter(c => tvProducto.nombre.toLowerCase().includes(c.toLowerCase()))
    return { nombre: tvProducto.nombre, canales: canalesActivos }
  }

  const tvInfo = getTVInfo()

  const codificarMotivoCierre = (texto: string) => {
    const t = texto.toLowerCase()
    if (t.includes('roaming') || t.includes('cargo')) return { motivo: 'Reclamación económica', submotivo: 'Cargo en factura' }
    if (t.includes('factura') || t.includes('importe')) return { motivo: 'Consulta facturación', submotivo: 'Consulta de factura' }
    if (t.includes('avería') || t.includes('internet') || t.includes('fibra') || t.includes('conexión')) return { motivo: 'Avería técnica', submotivo: 'Sin conexión / Fibra' }
    if (t.includes('cobro') || t.includes('deuda') || t.includes('pago')) return { motivo: 'Cobros', submotivo: 'Gestión de deuda' }
    if (t.includes('promo') || t.includes('descuento') || t.includes('oferta')) return { motivo: 'Comercial', submotivo: 'Consulta de oferta / Promoción' }
    if (t.includes('pedido') || t.includes('instalación') || t.includes('técnico')) return { motivo: 'Seguimiento pedido', submotivo: 'Estado de instalación' }
    if (t.includes('baja') || t.includes('cancel')) return { motivo: 'Retención / Baja', submotivo: 'Solicitud de baja' }
    if (t.includes('línea') || t.includes('móvil') || t.includes('sim')) return { motivo: 'Gestión de línea', submotivo: 'Consulta / Modificación línea móvil' }
    return { motivo: 'Atención general', submotivo: 'Consulta sin clasificar' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ height: 40, background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          onClick={() => { finalizarLlamada(); navigate('/') }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-primary)' }}>CRM Telco</span>
        </div>

        <div style={{ width: 1, height: 14, background: 'var(--color-border-tertiary)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-green)' }}>
          <span className="status-dot status-dot-ok" style={{ width: 6, height: 6 }} />
          Agente conectado
        </div>

        <div style={{ width: 1, height: 14, background: 'var(--color-border-tertiary)' }} />

        <select value={canalActual} onChange={e => setCanalActual(e.target.value as any)}
          style={{ height: 24, padding: '0 20px 0 6px', fontSize: 11, border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 5px center' }}>
          <option value="telefono">📞 Teléfono</option>
          <option value="tienda">🏪 Tienda</option>
          <option value="chat">💬 Chat</option>
          <option value="whatsapp">📲 WhatsApp</option>
        </select>

        {llamadaActiva && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', borderRadius: 'var(--border-radius-full)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-red-dark)', fontWeight: 600 }}>
            <span className="status-dot status-dot-err" style={{ width: 6, height: 6 }} />
            {formatTiempo(tiempoLlamada)}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
            style={{ width: 28, height: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, position: 'relative' }}>
            🔔
            {notifNoLeidas > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'var(--color-red-mid)', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifNoLeidas}
              </span>
            )}
          </button>
          {mostrarNotificaciones && (
            <div style={{ position: 'absolute', top: 34, right: 0, width: 280, background: 'var(--color-background-primary)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 11, fontWeight: 600 }}>Notificaciones</div>
              {notificaciones.length === 0
                ? <div style={{ padding: '16px', fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>Sin notificaciones</div>
                : notificaciones.map(n => (
                  <div key={n.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', background: n.leida ? 'transparent' : 'var(--color-blue-light)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 1 }}>{n.titulo}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{n.mensaje}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Notas */}
        <button onClick={() => setMostrarNotas(!mostrarNotas)}
          style={{ width: 28, height: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: notas ? 'var(--color-blue-light)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
          📝
        </button>

        <button onClick={() => setMostrarCierre(true)}
          style={{ height: 26, padding: '0 10px', fontSize: 11, fontWeight: 600, background: 'none', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
          Cerrar contacto
        </button>
      </div>

      {/* ── NOTAS OVERLAY ── */}
      {mostrarNotas && (
        <div style={{ position: 'fixed', top: 48, right: 14, width: 260, background: 'var(--color-background-primary)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Notas de llamada</div>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Escribe aquí..."
            style={{ width: '100%', height: 100, padding: 7, fontSize: 11, border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', resize: 'none', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)' }} />
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{notas.length} car.</div>
        </div>
      )}

      {/* ── CUERPO ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 210, background: 'var(--color-background-primary)', borderRight: '1px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Identidad cliente */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: esCritico ? 'var(--color-red-mid)' : esEnRiesgo ? 'var(--color-amber-mid)' : 'var(--color-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {cliente.nombre[0]}{cliente.apellidos[0] || ''}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cliente.nombre} {cliente.apellidos}
                </div>
                {/* RF-PI-01 RN-PI-08 — Diferenciación titular vs representante */}
                {(cliente as any).llamanteRepresentante && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, padding: '1px 6px', borderRadius: 9999, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                    👤 Representante autorizado — actúa en nombre del titular
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{cliente.dni}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {cliente.crmId}
              </span>
              <span className={`pill pill-${esCritico ? 'err' : esEnRiesgo ? 'warn' : 'ok'}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                {esCritico ? '⚠ Crítico' : esEnRiesgo ? 'En riesgo' : '✓ OK'}
              </span>
            </div>

            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{cliente.telefono}</div>
            {cliente.identificadoPorIVR && (
              <div style={{ fontSize: 10, color: 'var(--color-green)', marginTop: 3, fontWeight: 500 }}>✓ IVR identificado</div>
            )}
          </div>

          {/* Alertas activas */}
          {alertas.length > 0 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {alertas.map((a, i) => {
                const c = alertaColor(a.tipo)
                return (
                  <div key={i} onClick={() => navigate(`/cliente/${id}/${a.ruta}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', transition: 'opacity 0.1s' }}>
                    <span style={{ fontSize: 11, flexShrink: 0 }}>{a.icono}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.texto}</div>
                      {a.subtexto && (
                        <div style={{ fontSize: 9, color: c.color, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{a.subtexto}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: c.color, flexShrink: 0 }}>→</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Parque */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Parque</div>

            {cliente.productos.map(p => (
              <div key={p.id} style={{ marginBottom: 4 }}>
                <div
                  onClick={() => navigate(`/cliente/${id}/producto/${p.id}`)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 4px', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', background: 'transparent', transition: 'background 0.1s' }}
                >
                  <span style={{ fontSize: 12, width: 18, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>
                    {p.tipo === 'fibra' ? '📡' : p.tipo === 'tv' ? '📺' : p.tipo === 'movil' ? '📱' : '☎️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {p.nombre}
                      </div>
                      <span className={`status-dot ${p.estado === 'activa' ? 'status-dot-ok' : 'status-dot-err'}`} style={{ width: 6, height: 6, flexShrink: 0, marginLeft: 4 }} />
                    </div>

                    {(p.tipo === 'fibra' || p.tipo === 'fijo') && p.direccion && (
                      <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📍 {p.direccion}
                      </div>
                    )}

                    {p.tipo === 'tv' && (
                      <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                        {p.nombre.includes('Plus') ? 'Fútbol · Ficción · Netflix' : p.nombre}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contexto dinámico */}
          <div style={{ padding: '8px 12px', flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {moduloActivo === 'cobros' ? 'Deuda' :
               moduloActivo === 'averias' ? 'Estado técnico' :
               moduloActivo === 'venta' || moduloActivo === 'retencion' || moduloActivo === 'dispositivos' ? 'Bundle actual' :
               'Próximos eventos'}
            </div>

            {moduloActivo === 'cobros' && (
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: tieneDeuda ? 'var(--color-red)' : 'var(--color-green)', marginBottom: 4 }}>
                  {cliente.cobros.deudaTotal.toFixed(2)}€
                </div>
                <span className={`pill pill-${cliente.cobros.estadoGeneral === 'sin_deuda' ? 'ok' : cliente.cobros.estadoGeneral === 'vencida' ? 'err' : 'warn'}`} style={{ fontSize: 10 }}>
                  {cliente.cobros.estadoGeneral.replace('_', ' ')}
                </span>
              </div>
            )}

            {moduloActivo === 'averias' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: 'Red / OLT', ok: cliente.averias.length === 0 },
                  { label: 'CPE / Router', ok: !tieneDeuda },
                  { label: 'Masivas zona', ok: !cliente.averias.some(a => a.masiva) },
                  { label: 'Admin', ok: !tieneDeuda },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                    <span className={`status-dot ${row.ok ? 'status-dot-ok' : 'status-dot-err'}`} style={{ width: 7, height: 7 }} />
                  </div>
                ))}
              </div>
            )}

            {(moduloActivo === 'venta' || moduloActivo === 'retencion' || moduloActivo === 'dispositivos') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{cliente.bundleActual}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Porfolio: {cliente.porfolio}</div>
                {cliente.proximosEventos.slice(0, 2).map(ev => (
                  <div key={ev.id} style={{ fontSize: 10, padding: '4px 6px', background: ev.impacto === 'negativo' ? 'var(--color-amber-light)' : 'var(--color-blue-light)', borderRadius: 'var(--border-radius-sm)', color: ev.impacto === 'negativo' ? 'var(--color-amber-dark)' : 'var(--color-blue-dark)', lineHeight: 1.4 }}>
                    {ev.descripcion} — {ev.fecha}
                  </div>
                ))}
              </div>
            )}

            {moduloActivo === 'facturas' && tieneReclamacion && (
              <div
                onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                ⚠ {reclamacionesActivas.length} reclamación/es activa/s →
              </div>
            )}

            {moduloActivo === 'facturas' && tieneDeuda && (
              <div
                onClick={() => navigate(`/cliente/${id}/cobros`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-red-dark)', fontWeight: 600 }}>
                💳 Deuda {cliente.cobros.deudaTotal.toFixed(2)}€ pendiente →
              </div>
            )}

            {moduloActivo === 'reclamaciones' && tieneDeuda && (
              <div
                onClick={() => navigate(`/cliente/${id}/cobros`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-red-dark)', fontWeight: 600 }}>
                💳 Cobro bloqueado — ver deuda →
              </div>
            )}

            {moduloActivo === 'cobros' && tieneReclamacion && (
              <div
                onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                ⚠ {reclamacionesActivas.length} rec. bloquea cobro →
              </div>
            )}

            {moduloActivo === 'averias' && tieneDeuda && (
              <div
                onClick={() => navigate(`/cliente/${id}/cobros`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-red-dark)', fontWeight: 600 }}>
                💳 Avería bloqueada por deuda — gestionar cobro →
              </div>
            )}

            {moduloActivo === 'consumos' && tieneReclamacion && (
              <div
                onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                style={{ marginTop: 6, padding: '5px 7px', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                ⚠ Reclamación activa vinculada →
              </div>
            )}

            {!['cobros', 'averias', 'venta', 'retencion', 'dispositivos', 'facturas', 'reclamaciones', 'consumos'].includes(moduloActivo) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {cliente.proximosEventos.length === 0
                  ? <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Sin eventos próximos</div>
                  : cliente.proximosEventos.map(ev => (
                    <div key={ev.id} style={{ fontSize: 10, padding: '5px 7px', background: ev.impacto === 'negativo' ? 'var(--color-amber-light)' : ev.impacto === 'positivo' ? 'var(--color-green-light)' : 'var(--color-blue-light)', borderRadius: 'var(--border-radius-sm)', color: ev.impacto === 'negativo' ? 'var(--color-amber-dark)' : ev.impacto === 'positivo' ? 'var(--color-green-dark)' : 'var(--color-blue-dark)', lineHeight: 1.5 }}>
                      {ev.descripcion} · {ev.fecha}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── CONTEXTO IVR / TIENDA FIJO DESPLEGABLE ── */}
          {(cliente as any).canalContacto?.tipo === 'tienda' ? (
            <div
              onClick={() => setIvrAbierto(!ivrAbierto)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 20px', cursor: 'pointer',
                background: 'white', borderBottom: '1px solid var(--color-border-tertiary)',
                flexShrink: 0,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', flexShrink: 0 }}>
                <span style={{ fontSize: 11 }}>🏪</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-blue-dark)' }}>
                  Tienda · Turno {(cliente as any).canalContacto.turno}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {(cliente as any).canalContacto.intencion}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Llegada: {(cliente as any).canalContacto.horaLlegada}
              </span>
              {cliente.nps && (
                <div style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 9999, flexShrink: 0,
                  background: cliente.nps.segmento === 'promotor' ? 'var(--color-green-light)' : cliente.nps.segmento === 'detractor' ? 'var(--color-red-light)' : 'var(--color-amber-light)',
                  border: `1px solid ${cliente.nps.segmento === 'promotor' ? 'var(--color-green-border)' : cliente.nps.segmento === 'detractor' ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cliente.nps.segmento === 'promotor' ? 'var(--color-green-dark)' : cliente.nps.segmento === 'detractor' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>
                    NPS {cliente.nps.valor}
                  </span>
                  <span style={{ fontSize: 10, color: cliente.nps.segmento === 'promotor' ? 'var(--color-green-dark)' : cliente.nps.segmento === 'detractor' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>
                    · {cliente.nps.segmento}
                  </span>
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: ivrAbierto ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
            </div>
          ) : cliente.ivr ? (
            <div style={{
              background: 'white',
              borderBottom: `1px solid ${ivrAbierto ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              {/* Barra colapsada — siempre visible */}
              <div
                onClick={() => setIvrAbierto(!ivrAbierto)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 20px', cursor: 'pointer',
                  background: 'white',
                }}>
                {/* Indicador llamada activa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#ffebee', border: '1px solid #ef9a9a', flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e53935' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b71c1c', fontFamily: 'monospace' }}>
                    {formatTiempo(tiempoLlamada)}
                  </span>
                </div>

                {/* Motivo IVR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                    {cliente.ivr.identificado ? '✓ IVR identificado' : '○ No identificado'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {cliente.resumenNatural}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                    Espera: {cliente.ivr.tiempoEspera}
                  </span>
                </div>

                {/* NPS inline */}
                {cliente.nps && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px',
                    borderRadius: 9999, flexShrink: 0,
                    background: cliente.nps.segmento === 'promotor' ? '#e8f5e9' : cliente.nps.segmento === 'detractor' ? '#ffebee' : '#fff8e1',
                    border: `1px solid ${cliente.nps.segmento === 'promotor' ? '#a5d6a7' : cliente.nps.segmento === 'detractor' ? '#ef9a9a' : '#ffe082'}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cliente.nps.segmento === 'promotor' ? '#2e7d32' : cliente.nps.segmento === 'detractor' ? '#b71c1c' : '#f57f17' }}>
                      NPS {cliente.nps.valor}
                    </span>
                    <span style={{ fontSize: 10, color: cliente.nps.segmento === 'promotor' ? '#2e7d32' : cliente.nps.segmento === 'detractor' ? '#b71c1c' : '#f57f17' }}>
                      · {cliente.nps.segmento}
                    </span>
                  </div>
                )}

                {/* Flecha expand */}
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: ivrAbierto ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                  ▼
                </span>
              </div>

              {/* Panel expandido */}
              {ivrAbierto && (
                <div className="fade-in" style={{ padding: '12px 20px 14px', borderTop: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Motivo IVR', val: cliente.ivr.motivo },
                      { label: 'Submotivo', val: cliente.ivr.submotivo || '—' },
                      { label: 'Canal', val: cliente.ivr.canal || 'Teléfono' },
                      { label: 'Tiempo espera', val: cliente.ivr.tiempoEspera },
                    ].map(r => (
                      <div key={r.label} style={{ background: 'white', border: '1px solid var(--color-border-tertiary)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* NPS expandido */}
                  {cliente.nps && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'white', border: '1px solid var(--color-border-tertiary)', borderRadius: 6, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: cliente.nps.segmento === 'promotor' ? '#2e7d32' : cliente.nps.segmento === 'detractor' ? '#e53935' : '#f57f17', lineHeight: 1 }}>
                          {cliente.nps.valor}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>/ 10</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[...Array(10)].map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < cliente.nps!.valor ? (cliente.nps!.segmento === 'promotor' ? '#2e7d32' : cliente.nps!.segmento === 'detractor' ? '#e53935' : '#f57f17') : '#e0e0e0' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                          <span>Detractor</span><span>Pasivo</span><span>Promotor</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: cliente.nps.segmento === 'promotor' ? '#2e7d32' : cliente.nps.segmento === 'detractor' ? '#b71c1c' : '#f57f17', textTransform: 'capitalize' }}>{cliente.nps.segmento}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{cliente.nps.fecha} · {cliente.nps.canal}</div>
                      </div>
                    </div>
                  )}

                  {/* Alertas contextuales automáticas */}
                  {(() => {
                    const alertasCtx = []
                    if (cliente.reclamaciones?.some(r => r.estado === 'abierta' || r.estado === 'en_gestion')) {
                      alertasCtx.push({ txt: 'Reclamación activa — no ofertar hasta resolución', color: '#b71c1c', bg: '#ffebee', border: '#ef9a9a' })
                    }
                    const consumosAnomalos = consumosPorCliente[id || '']?.filter((c) => c.anomalo)
                    if (consumosAnomalos?.length > 0) {
                      const total = consumosAnomalos.reduce((a, c) => a + c.importe, 0)
                      alertasCtx.push({ txt: `${consumosAnomalos.length} consumos anómalos detectados · ${total.toFixed(2)}€ en disputa`, color: '#e65100', bg: '#fff3e0', border: '#ffcc80' })
                    }
                    if (cliente.cobros?.estadoGeneral === 'vencida') {
                      alertasCtx.push({ txt: `Deuda vencida ${cliente.cobros.deudaTotal.toFixed(2)}€ — gestionar en Cobros`, color: '#b71c1c', bg: '#ffebee', border: '#ef9a9a' })
                    }
                    if (alertasCtx.length === 0) return null
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {alertasCtx.map((a, i) => (
                          <div key={i} style={{ padding: '6px 10px', borderRadius: 6, background: a.bg, border: `1px solid ${a.border}`, fontSize: 11, color: a.color, fontWeight: 500 }}>
                            ⚠ {a.txt}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ) : null}

          {/* Tabs */}
          <div style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)', padding: '0 14px', display: 'flex', alignItems: 'center', overflowX: 'auto', flexShrink: 0 }}>
            {tabs.map(tab => {
              const isActive = moduloActivo === tab.id
              const hasAlert = (tab.badge || 0) > 0
              return (
                <NavLink key={tab.id} to={`/cliente/${id}/${tab.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 10px', borderBottom: `2px solid ${isActive ? 'var(--color-blue)' : 'transparent'}`, cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-blue-dark)' : hasAlert ? 'var(--color-red)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {tab.label}
                    {(tab.badge || 0) > 0 && (
                      <span style={{ minWidth: 15, height: 15, borderRadius: 8, background: 'var(--color-red-mid)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              )
            })}
          </div>

          {/* Área contenido */}
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── MODAL CIERRE DE CONTACTO RF-09 ── */}
      {mostrarCierre && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-lg)', width: 480, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Cerrar contacto</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {cliente.nombre} {cliente.apellidos} · {formatTiempo(tiempoLlamada)} de llamada
              </div>
            </div>

            {/* Motivo libre con autocodificación */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Motivo del contacto
              </div>
              <textarea
                className="input"
                placeholder="Describe brevemente el motivo de la llamada..."
                value={cierreMotivo}
                onChange={e => {
                  setCierreMotivo(e.target.value)
                  if (e.target.value.length > 8) {
                    setCierreMotivoCode(codificarMotivoCierre(e.target.value))
                  } else {
                    setCierreMotivoCode(null)
                  }
                }}
                style={{ height: 72, resize: 'none', paddingTop: 8 }}
                autoFocus
              />
              {cierreMotivoCode && (
                <div className="fade-in" style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>🤖 Autocodificación sugerida</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>{cierreMotivoCode.motivo}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>↳ {cierreMotivoCode.submotivo}</div>
                  </div>
                  <button
                    onClick={() => setCierreMotivoCode(null)}
                    style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-border-secondary)', background: 'white', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* ¿Resuelto? */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ¿Consulta resuelta?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: true, label: '✓ Sí, resuelta', color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)' },
                  { val: false, label: '✕ No resuelta', color: 'var(--color-red-dark)', bg: 'var(--color-red-light)', border: 'var(--color-red-border)' },
                ].map(op => (
                  <button
                    key={String(op.val)}
                    onClick={() => setCierreResuelto(op.val)}
                    style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${cierreResuelto === op.val ? op.border : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: cierreResuelto === op.val ? op.bg : 'transparent', color: cierreResuelto === op.val ? op.color : 'var(--color-text-secondary)', fontSize: 12, fontWeight: cierreResuelto === op.val ? 700 : 400, cursor: 'pointer', transition: 'all 0.1s' }}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen del contacto */}
            <div style={{ padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Canal</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{canalActual}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Duración</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{formatTiempo(tiempoLlamada)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Motivo codificado</span>
                <span style={{ fontWeight: 600, color: 'var(--color-blue-dark)' }}>{cierreMotivoCode?.motivo || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Resultado</span>
                <span style={{ fontWeight: 600, color: cierreResuelto === true ? 'var(--color-green-dark)' : cierreResuelto === false ? 'var(--color-red-dark)' : 'var(--color-text-tertiary)' }}>
                  {cierreResuelto === true ? '✓ Resuelta' : cierreResuelto === false ? '✕ No resuelta' : '—'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  if (!cierreMotivo.trim() || cierreResuelto === null) return
                  setCierreCerrando(true)
                  setTimeout(() => {
                    finalizarLlamada()
                    navigate('/')
                  }, 1000)
                }}
                disabled={cierreCerrando || !cierreMotivo.trim() || cierreResuelto === null}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                {cierreCerrando
                  ? <><span className="spinner spinner-sm" /> Cerrando...</>
                  : '✓ Confirmar cierre'}
              </button>
              <button
                onClick={() => setMostrarCierre(false)}
                className="btn-secondary"
                style={{ fontSize: 12 }}>
                Cancelar
              </button>
            </div>

            {(!cierreMotivo.trim() || cierreResuelto === null) && (
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: -8 }}>
                El motivo y el resultado son obligatorios para cerrar el contacto
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}